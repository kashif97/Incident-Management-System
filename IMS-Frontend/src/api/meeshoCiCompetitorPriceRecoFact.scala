package com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.meeshoCiCompetitorModel
import com.flipkart.fdp.shade.gondor.model.dataset.WriteMode
import com.flipkart.seldon.dataservice.common.CoreJob
import com.flipkart.seldon.dataservice.common.SeldonQueryExecutor.SparkQueryExecutor
import com.flipkart.seldon.dataservice.common.config.ConfigProperties
import com.flipkart.seldon.dataservice.common.constant.DefaultDatatypeValues. (DOUBLE_DEFAULT_VALUE, INT_DEFAULT_VALUE, STRING_DEFAULT_VALUE)
import com.flipkart.seldon.dataservice.common.constant.JoinTypes
import com.flipkart.seldon.dataservice.common.util.DateUtils, Transformers}
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.CiCompetitorModel.CiCompetitorPriceRecoFact.config
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.CiCompetitorModel.ListingHiveDimQuery
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.Generator.(SellerDemandWeightGenerator, ValueTagGenerator}
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.ListingLevelUtils.ListingLevelUtils
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco. Price RecoSchemaHelper
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco. VariantsUtils.VariantsUtils
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.commonQueries.CatalogQuery
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.utils.MySQLUtils
import com.flipkart.seldon.dataservice.sellerinsights.common.InsightQualifiers._
import com.flipkart.seldon.dataservice.sellerinsights.common.PriceRecoConstants.DEFAULT_STATUS
import com.flipkart.seldon.dataservice.sellerinsights.common.PriceRecoConstants.Intermarket._
import com.flipkart.seldon.dataservice.sellerinsights.common.helpers.PriceRecoIngestionHelper
import com.flipkart.seldon.dataservice.sellerinsights.common.queries._
import com.flipkart.seldon.dataservice.sellerinsights.common._
import com.flipkart.seldon.dataservice.sink.config.FdpHiveSinkConfig
import com.flipkart.seldon.dataservice.sink.impl.writer.SparkSinkWriter.SinkWriterFunctions
import com.google.inject.Module
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions.{lit, when, _}
import org.apache.spark.sql.types.{DoubleType, IntegerType, StringType}
import org.joda.time.DateTime

import java.lang
import org.apache.spark.sql.expressions.Window
import org.apache.spark.storage.StorageLevel

object MeeshoCiCompetitorPriceRecoFact extends CoreJob {
    override def execute(ss: SparkSession, args: Array [String]): Unit = {
        val tokenizedArgs: Map [String, Array [String]] = Transformers.argsTokenizer(args).toMap
        if (tokenizedArgs.contains("run")) {
            if (!tokenizedArgs("run").head.toBoolean) {
                println("run is false, stopping the job")
                return
            }
        }

        val pulsarEnabled = ConfigProperties.getValueAs [String] ("seldon.sellerinsights.meesho.ciintermarket.pulsar.enable", config)
        val costOfDoingBusiness = ConfigProperties.getValueAs [Int] ("seldon.sellerinsights.meesho.ciintermarket.codb", config)
        val platinumCostOfDoingBusiness = ConfigProperties.getValueAs [Int] ("seldon.sellerinsights.meesho.ciintermarket.platinum.codb", config)
        val goldTunerCostOfDoing Business = ConfigProperties.getValueAs [Int] ("seldon.sellerinsights.meesho.ciintermarket.gold.codb", config)
        val silverTunerCostOfDoing Business = ConfigProperties.getValueAs [Int] ("seldon.sellerinsights.meesho.ciintermarket.silver.codb", config)
        val bronzeTunerCostOfDoingBusiness = ConfigProperties.getValueAs [Int] ("seldon.sellerinsights.meesho.ciintermarket.bronze.codb", config)
        val tuner = ConfigProperties.getValueAs [Double] ("seldon.sellerinsights.meesho.ciintermarket.tuner", config)
        val drop = ConfigProperties.getValueAs [Double] ("seldon.sellerinsights.meesho.ciintermarket.drop", config)
        val factName = ConfigProperties.getValueAs [String] ("seldon.sellerinsights.meesho.ciintermarket.factname", config)
        val currentDateMinus30 = date_format(date_sub(current_date(), 30), "yyyyMMdd")
        val meeshoCiCompetitorDf = ss.executeQuery("select * from bigfoot_external_neo.sp_analytics_meesho_product_level_fact")
        //    .filter(col(FACT_DATE).gt(currentDateMinus30))
        .drop(col(FACT_DATE))
        .drop(col(SELLER_ID))
        val lhdDF = ss.executeQuery(ListingHiveDimQuery)
        lhdDF.persist(StorageLevel.MEMORY_AND_DISK)
        val phdDF = ss.executeQuery(ProductHiveDimQuery)
        val listingTagDF = ss.executeQuery(ListingTagQueryV2)
        val sellerHiveDF = ss.executeQuery(SellerHiveDimQuery)
        val actionedPriceRecoDF = ss.executeQuery(ActionedPriceRecoQuery)
        val brandBandDF = ss.executeQuery(BrandBandFactQuery)
        val verticalBand = ss.executeQuery(VerticalBandFactQuery)
        // Local query (includes units_15_days) to avoid changing ListingVerticalMetricsFactQuery output schema globally.
        val listingVerticalMetricsDF = ss.executeQuery(
        "select listing_id, units_15_days, drr_15_days, drr_60_days, conversion_15_days, conversion_60_days, vertical_conversion_60_days
        "from bigfoot_external_neo.sp_analytics_listing_vertical_metrics_fact"
        )
        val catalogDF=ss.executeQuery(CatalogQuery)
        catalogDF.persist (StorageLevel.MEMORY_AND_DISK)
        val lqsDF = ss.executeQuery ListingLQSQuery)
        val lhdBaseQueryDF = ss.executeQuery(ListingHiveDimQuery)

        val lowestPriceFactMaxDateDf = ss.generateLowestPriceFactMaxDate()
        val lowestPriceYearQueryDf = ss.generateLowestPriceYear(lowestPriceFactMaxDateDf.first().get(0))
        val lowestPriceSinceLaunchQueryDf = ss.generateLowestPriceSinceLaunch (lowestPriceFactMaxDateDf.first().get(0))

        val categoryValueTagThresholdDF = ss.executeQuery(CategoryValueTagThresholdQuery)
        val demandWeightDF = ss.generateDemandWeight() val
        dayMinus30Int = DateUtils.convertStringDateToInt(DateUtils.getCustomDateStr(DateTime.now().minusDays(30)), DateUtils.Formats.FORMATTER_YYYYMMDD)
        val sellerPriceRecoHistoryDf = ss.executeQuery("select listing_id, created_at from bigfoot_external_neo.sp_analytics_seller_price_reco_history_fact where status = 'CREATED' and insight_date_key >"+dayMinus30Int)

        val meeshoCiListingDf = meeshoCiCompetitorDf
            .withColumn (RECO_PRICE,
            when (col(SELLER_TIER).equalTo("platinum"), meeshoCiCompetitorDf(MEESHO_SELLING_PRICE).plus (platinumCostOfDoing Business))
                .otherwise(
                    when (col(SELLER_TIER).equalTo("gold"), meeshoCiCompetitorDf (MEESHO_SELLING_PRICE).plus(goldTunerCostOfDoing Business)) .otherwise(
                        .otherwise(
                            when(col(SELLER_TIER).equalTo("silver"), meeshoCiCompetitorDf (MEESHO_SELLING_PRICE).plus(silverTunerCostOfDoing Business))
                                .otherwise(
                                    when(col(SELLER_TIER).equalTo("bronze"), meeshoCiCompetitorDf(MEESHO_SELLING_PRICE).plus (bronzeTunerCostOfDoingBussiness))
                                    .otherwise(meeshoCiCompetitorDf(MEESHO_SELLING_PRICE).plus(costOfDoingBussiness))
                                }
                        }
                }
        }

        )
        val filteredMeeshoCiListingDf= meeshoCiListingDf.filter(
            col (RECO_PRICE).lt(col(FLIPKART_SELLING_PRICE))
        ).withColumn (
        RECO_PRICE,
        when(col(RECO_PRICE).gt(col(FLIPKART_SELLING_PRICE).multiply(drop)), col(RECO_PRICE))
         .otherwise(col (FLIPKART_SELLING_PRICE).multiply(drop))
        ).select(
            col(SKU),
            col (MEESHO_SKU).as(MSKU),
            col(URL_TO_PROD),
            col(IMG_URL),
            col(LISTING_ID),
            col (PRODUCT_ID),
            col(FLIPKART_SELLING_PRICE),
            col (MEESHO_SELLING_PRICE),
            col (RECO_PRICE),
            col (SELLER_TIER)
           )

        filteredMeeshoCiListingDf.persist(StorageLevel.MEMORY_AND_DISK)

        val dayMinus90: String = DateUtils.getDateAsFactDate(DateUtils.getYesterdayJodaTime.minusDays (90))
        val dayMinus1: String = DateUtils.getDateAsFactDate(DateTime.now().minusDays(1))
        val fufVerticalFilteredDf = ss.executeQuery(ForwardUnitFactQuery.build().format(dayMinus90, dayMinus1))

        wal fufLast90DaysDF = fufVerticalFilteredDf
            .groupBy(col(LISTING_ID))
            .agg(sum(col(UNITS)).as (UNITS), sum(col(GMV)).as(GMV));

        val variantsWindow = Window.partitionBy(GROUP_ID, FLIPKART_SELLING_PRICE).orderBy(col("units_90_days").desc).orderBy(col(RECO_PRICE).asc);

        val meeshoDfwithGid = filteredMeeshoCiListingDf
            .join(lhdDF, filteredMeeshoCiListingDf(LISTING_ID).equalTo(lhdDF(LISTING_ID)), JoinTypes.LEFT)
            .filter(lhdDF(LISTING_ID).isNotNull)
            .join(fufLast90DaysDF, fiferedMeeshoCiListingDf(LISTING_ID).equalTo(fufLast90DaysDF (LISTING_ID)), JoinTypes.LEFT)
            .join(catalogDF, filteredMeeshoCiListingDf (PRODUCT_ID).equalTo(catalogDF (PRODUCT_ID)), JoinTypes.LEFT)
            .filter(catalogDF (GROUP_ID).isNotNull)
            .select(
            filteredMeeshoCiListingDf("*"),
            lhdDF (SELLER_ID).as (SELLER_ID),
            fufLast90DaysDF (UNITS).as("units_90_days"),
            catalogDF(GROUP_ID).as (GROUP_ID),
            catalogDF (VARIANT_TYPE).as (VARIANT_TYPE)
            val meeshoDfGroups = meeshoDfwithGid
            withColumn("row", row_number().over(variantsWindow))
            .filter(col("row").equalTo(lit(1)))
            .drop("row");
            val listingWithVariantsDF = lhdDF
            .join(catalogDF, Seq (PRODUCT_ID), JoinTypes. LEFT)
            .select(lhdDF("*"), catalogDF(GROUP_ID).as(GROUP_ID), catalogDF (VARIANT_TYPE).as (VARIANT_TYPE))
            .filter(col(GROUP_ID).isNotNull);

        val variantsDf = meeshoDfGroups
            .join(listingWith VariantsDF,
                meeshoDfGroups (GROUP_ID).equalTo(listingWith VariantsDF(GROUP_ID))
                    .and (meeshoDfGroups (SELLER_ID).equalTo(listingWith VariantsDF (SELLER_ID)))
                    .and (meeshoDfGroups (FLIPKART_SELLING_PRICE).equalTo(listingWith VariantsDF(FLIPKART_SELLING_PRICE))),
                JoinTypes.LEFT
            )
            .filter(meeshoDfGroups (LISTING_ID).notEqual(listingWith VariantsDF (LISTING_ID)))
            .select(
                listingWithVariantsDF (LISTING_ID).as(LISTING_ID),
                listingWith VariantsDF(PRODUCT_ID).as(PRODUCT_ID),
                listingWithVariantsDF(SKU).as(SKU),
                listingWith VariantsDF (FLIPKART_SELLING_PRICE).as(FLIPKART_SELLING_PRICE),
                meeshoDfGroups (RECO_PRICE).as(RECO_PRICE),
                meeshoDfGroups (SELLER_TIER).as (SELLER_TIER),
                meeshoDfGroups (MEESHO_SELLING_PRICE).as(MEESHO_SELLING_PRICE),
                meeshoDfGroups (IMG_URL).as(IMG_URL),
                meeshoDfGroups (URL_TO_PROD).as(URL_TO_PROD),
                meeshoDfGroups (MSKU).as(MSKU)
            )

        val filteredMeeshoCiListingDF = filteredMeeshoCiListingDf.unionByName(variantsDf).dropDuplicates()

        val baseRecoDF = filteredMeeshoCiListingDF
            .join(lhdDF, lhdDF (LISTING_ID).equalTo(filteredMeeshoCiListingDF (LISTING_ID)), JoinTypes.LEFT)
            .join(phdDF, lhdDF(PRODUCT_ID).equalTo(phdDF(PRODUCT_ID)), JoinTypes.LEFT)
            .join(listingTagDF, 1hdDFLISTING_ID).equalTo(listingTagDF(LISTING_ID)), JoinTypes. LEFT)
            .join(actionedPriceRecoDF, lhdDF (LISTING_ID).equalTo(actionedPriceRecoDF (LISTING_ID)), JoinTypes.LEFT)
            .join(listingVerticalMetricsDF, lhdDF (LISTING_ID).equalTo(listingVerticalMetricsDF (LISTING_ID)), JoinTypes,LEFT)
            .join(brandBandDF, lhdDF (SELLER_ID).equalTo(brandBandDF (SELLER_ID)).and(lhdDF (BRAND).equalTo(brandBandDF(BRAND))), JoinTypes.LEFT)
            .join(verticalBand, lhdDF (SELLER_ID).equalTo(verticalBand (SELLER_ID)).and (phdDF (ANALYTIC_VERTICAL).equalTo(verticalBand (VERTICAL))), JoinTypes.LEFT)
            .join(lqsDF, lhdDF (LISTING_ID).equalTo(lqsDF (LISTING_ID)), JoinTypes. LEFT)
            .join(lowestPriceYearQueryDf, lhdDF (LISTING_ID).equalTo(lowestPriceYear QueryDf (LISTING_ID)), JoinTypes.LEFT)
            .join(lowestPriceSinceLaunchQueryDf, lhdDF(LISTING_ID).equalTo(lowestPriceSinceLaunchQueryDf (LISTING_ID)), JoinTypes.LEFT) )).equalTo(lower(categoryValueTagThresholdDF (ANALYTIC_CATEGORY))
            .join(categoryValueTagThresholdDF, lower (lhdDF (ANALYTIC_CATEGORY .join(sellerPriceRecoHistoryDf, lhdDF(LISTING_ID).equalTo(sellerPriceRecoHistoryDf(LISTING_ID)), JoinTypes.LEFT)
            .select(
                when (
                    listingVerticalMetricsDF.col(UNITS_15_DAYS).isNull.or(listingVerticalMetricsDF.col(UNITS_15_DAYS).equalTo(0)),
                    5
                ).otherwise(
                    (listingVerticalMetricsDF.col (UNITS_15_DAYS).divide(lit(15.0)))
                        .multiply(lit(0.2)) .multiply(lit(7))
                ).as (INCREMENTAL_DRR),
                lhdDF (LISTING_ID),
                1hdDF (SELLER_ID),
                lhdDF (ANALYTIC_VERTICAL),
                lhdDF (ANALYTIC_CATEGORY,
                lhdDF(SKU),
                lhdDF(FLIPKART_SELLING_PRICE),
                lhdDF (PRODUCT_ID),
                lhdDF (SERVICE_PROFILE),
                1hdDF(IS_EXPRESS_LISTING).cast(StringType),
                lhdDF (IS_FASSURED_LISTING).cast(StringType),
                lhdDF (PROCUREMENT_SLA).cast (IntegerType),
                LhdDF (MRP),
                lhdDF (BRAND),
                phdDF (CMS_VERTICAL),
                phdDF(TITLE),
                filteredMeeshoCiListingDF (SELLER_TIER),
                filteredMeeshoCiListingDF(MSKU).as(COMP_PRODUCT_ID),
                filteredMeeshoCiListingDF (MEESHO_SELLING_PRICE).as (COMP_FINAL_PRICE),
                filteredMeeshoCiListingDF(URL_TO_PROD).as (COMP_PRODUCT_LINK),
                filteredMeeshoCiListingDF(IMG_URL).as(COMP_PRODUCT_IMG_LINK),
                filteredMeeshoCiListingDF (RECO_PRICE),
                PriceRecoHelper.defaultListingTagUdf(listingTagDF(TAG)).as (TAGS),
                when (brandBandDF(BRAND_BAND).isNull, PriceRecoConstants.DEFAULT_BAND).otherwise (brandBandDF (BRAND_BAND)).as (BRAND_BAND),
                when(verticalBand (VERTICAL_BAND).isNull, PriceRecoConstants.DEFAULT_BAND).otherwise(verticalBand (VERTICAL_BAND)).as (VERTICAL_BAND)
                when(actionedPriceRecoDF(LAST ADOPTED PRICE).isNull. DOUBLE DEFAULT VALUE).otherwise(actionedPriceRecoDF(LAST ADOPTED PRICE))
                when(actionedPriceRecoDF (LAST_RECO_PRICE).isNull, DOUBLE_DEFAULT_VALUE).otherwise (actionedPriceRecoDF (LAST_RECO_PRICE)).as (LAS , DEFAULT_STATUS).otherwise (actionedPriceRecoDF (LAST_RECO_STATUS)).as (LAST_RE
                when(actionedPriceRecoDF(LAST_RECO_STATUS).isNull when(actionedPriceRecoDF (LAST_UPDATED_DATE).isNull, STRING_DEFAULT_VALUE).otherwise (actionedPriceRecoDF (LAST_UPDATED_DATE)).as
                listingVerticalMetricsDF (DRR_15_DAYS).as (DRR_15_DAYS),
                listingVerticalMetricsDE (DRR_60_DAYS).as (DRR_60_DAYS),
                listingVerticalMetricsDF (CONVERSION_15_DAYS).as (CONVERSION_15_DAYS),
                listingVerticalMetricsDF(CONVERSION_60_DAYS).as (CONVERSION_60_DAYS),
                listingVerticalMetricsDF(VERTICAL_CONVERSION_60_DAYS).as (VERTICAL_CONVERSION_60_DAYS),
                when (lqsDF(LQS_COMPUTED_CLUSTER).isNull, INT_DEFAULT_VALUE).otherwise (1qsDF (LQS_COMPUTED_CLUSTER)).as (LQS_COMPUTED_CLUSTER),
                when (lowestPriceYear QueryDf (LOWEST_PRICE_YEAR).isNull,DOUBLE_DEFAULT_VALUE).otherwise (lowestPriceYear QueryDf (LOWEST_PRICE_YEAR
                when (lowestPriceSinceLaunchQueryDf (LOWEST_PRICE_SINCE_LAUNCH).isNull,DOUBLE_DEFAULT_VALUE).otherwise (lowestPriceSinceLaunchQue
                when(categoryValueTagThresholdDF (HOT_DEAL_THRESHOLD).isNull, DOUBLE_DEFAULT_VALUE).otherwise(categoryValueTagThresholdDF (HOT_DI
                when(categoryValueTagThresholdDF (DAILY_SAVER_DEAL_THRESHOLD).isNull, DOUBLE_DEFAULT_VALUE).otherwise (categoryValueTagThresholdi
                when (sellerPriceRecoHistoryDf(CREATED_AT).isNull, "NEW").otherwise(sellerPriceRecoHistoryDf (CREATED_AT)).as (LAST_CREATED_DATE)
                .na.fill(0.0, Seq (DRR_15_DAYS, DRR_60_DAYS, CONVERSION_60_DAYS, CONVERSION_15_DAYS, VERTICAL_CONVERSION_60_DAYS))
                .withColumn(
                InsightQualifiers.FINAL_PRICE,
                col(InsightQualifiers.FLIPKART_SELLING_PRICE)
                )
                .withColumn(
                InsightQualifiers. REFERENCED_ENTITY_PRICE,
                col(COMP_FINAL_PRICE)
                )
                .withColumn(
                InsightQualifiers. REFERENCED_ENTITY_ID,
                col(COMP PRODUCT TO)
                )
                )
                .withColumn (
                ) InsightQualifiers.MODEL_NAME, lit (INTERMARKET_MEESHO)
                .withColumn ( InsightQualifiers.INSIGHT_CREATION_TIMESTAMP, lit(System.currentTimeMillis())
                .join(catalogDF, Seq (PRODUCT_ID), JoinTypes.LEFT)
                .join(demandWeightDF, Seq (SELLER_ID), JoinTypes.LEFT)
                .withColumn(DEMAND_WEIGHT, demandWeightDF(DEMAND_WEIGHT).cast(DoubleType))
                .dropDuplicates("listing_id")

                baseRecoDF.persist (StorageLevel.MEMORY_AND_DISK)
                val fdpSinkConfig = FdpHiveSinkConfig(DatasetConfigDetails.MEESHO_CI_INTERMARKET_PRICE_RECO_FACT, WriteMode.OVERWRITE)
                baseRecoDF.writeToFdpSink(fdpSinkConfig)

                var published = false
                val priceRecoColumnRenamedDF = PriceRecoHelper.ciIntermarketKafkaRenameColumns (baseRecoDF)
                val serializedDf = PriceRecoSchemaHelper.transformPayloadCi(ss, priceRecoColumnRenamedDF)
                try {
                    if (pulsarEnabled.equals("true") && enableExternalSink) {
                        PriceRecoIngestionHelper.writeToPulsarSinkV3(injector, serializedDf.repartition(10), InsightTypes.PRICE_RECO, enableExternalSi
                    }
                    published = true
                }

                catch {
                    case ex: Exception =>throw ex
                }

                finally {
                val publishedCount= if (published) baseRecoDF.count() else OL
                MySQLUtils.persistGeneratedRecoCount(ss, baseRecoDF.count(), publishedCount, INTERMARKET_MEESHO, PriceRecoConstants.JobTypeForAu
                }
                }
                override var environment: Function [Map [String, Array [String]], lang. Iterable[ <: Module]] = SellerInsightConstants.ENVIRONMENT_MAPPI
                }