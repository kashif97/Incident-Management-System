package com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.meeshoCiCompetitorModel

import com.flipkart.fdp.shade.gondor.model.dataset.writeModes under seldon-data-service-apps
import com.flipkart.seldon.dataservice.common.SeldonQueryExecutor.SparkqueryExecûter and sink utilities.
import com.flipkart.seldon.datammon.SparkBatchJobon beyond its usage as a package path.
import com.flipkart.seldon.data Loadingiommon.config.ConfigProperties
import com.flipkart.seldon.dataservice.common.config.ConfigProperties.ConfigPropertiesFunctions
import com.flipkart.seldon.dataservice.common.constant.JoinTypes
import com.flipkart.seldon.dataservice.common.util.DateUtils
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco. CiCompetitorModel.CiCompetitorPriceRecoFact.config
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.CiCompetitorModel.ListingHiveDimQuery
import com.flipkart.seldon.dataservice.sellerinsights.adhoc.pricereco.meeshoCiCompetitorModel.query.(MeeshoCiCompetitorFactQuery, MeeshoDailyDataHelper, MeeshoPriceRecoEntityQuery, MeeshoProductDetailsFactQuery}
import com.flipkart.seldon.dataservice.sellerinsights.common.DatasetConfigDetails
import com.flipkart.seldon.dataservice.sellerinsights.common.InsightQualifiers. (DARWIN_TIER, DATE_KEY, FACT_DATE, FLIPKART_SELLING_PRICE, INT, LISTING_ID, MARKETPLACE_ID, MEESHO_SKU, PRODUCT_ID, ROW_NUM, SELLER_ID, SELLER_TIER, SKU}
import com.flipkart.seldon.dataservice.sellerinsights.common.PriceRecoConstants.Intermarket. (COMPETITOR NAME, COMP_SELLER_PRODUCT_PRICE, COMP_SKU, CRAWL+PINCODE, CRAWL_TIMESTAMP, DATA, FSN_DISPLAYED_PRODUCT_PRICE, IMG_URL, MEESHO_SELLING_PRICE, MSKU, NEW_PRICE, URL_TO_PROD}
import com.flipkart.seldon.dataservice.sellerinsights.common.queries. SellerHiveDimQuery
import com.flipkart.seldon.dataservice.sink.config.FdpHiveSinkConfig
import com.flipkart.seldon.dataservice.sink.impl.writer.SparkSinkWriter.SinkWriterFunctions
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.expressions.Window
import org.apache.spark.sql.functions.(ceil, coalesce, col, current_date, date_format, date_sub, from_unixtime, get_json_object, hour, lit, lower, row_number, unix_timestamp, when}
import org.apache.spark.sql.types. Integer Type
import org.joda.time.DateTime
object Meesho ProductsGenerationJob extends SparkBatchJob{
/**
*
@param ss [[SparkSession]] that will be used for computation in Current Application
* @param args input argument for current application
*/
override def execute(ss: SparkSession, args: Array [String]) = {
val crawlFromDays = ConfigProperties.getValueAs [Int] ("seldon.sellerinsights.meesho.ciintermarket.crawl.days", config)
val meeshoDrop = ConfigProperties.getValueAs [Double] ("seldon.sellerinsights.meesho.ciintermarket.reco.price.drop", config)
val val meeshoWindow = Window.partitionBy(col(PRODUCT_ID)).orderBy(col(DATE_KEY).desc)
meeshoConstraint = ConfigProperties.getValueAs [Double] ("seldon.sellerinsights.meesho.ciintermarket.reco.price.constraint", config)
val meeshoData = ss.executeQuery(MeeshoPriceRecoEntityQuery.build().format(crawlFromDays))
.select(
get_json_object(col(DATA), "$.marketplace_id").as (MARKETPLACE_ID),
get_json_object(col(DATA), "$.competitor_name").as (COMPETITOR NAME),
get_json_object(col(DATA), "$.fsn").as (PRODUCT_ID),
coalesce(get_json_object(col(DATA), "$.comp_seller_product_price"), lit(0)).as(COMP_SELLER_PRODUCT_PRICE),
get_json_object(col (DATA), "$.fsn_displayed_product_price").as (FSN_DISPLAYED_PRODUCT_PRICE),
get_json_object(col(DATA), "$.crawl_pincode").as (CRAWL_PINCODE),
get_json_object(col(DATA), "$.comp_sku").as(COMP_SKU),
from_unixtime(get_json_object(col(DATA), "$.crawl_timestamp").cast(IntegerType)).cast("date").as(DATE_KEY),
from_unixtime(get_json_object(col(DATA), "$.crawl_timestamp").cast(IntegerType)).as (CRAWL_TIMESTAMP)
.filter(lower(get_json_object(col(DATA), "$.competitor_name")).equalTo(lit("meesho")))
.filter(lower(get_json_object(col(DATA), "$.marketplace_id")).equalTo(lit("flipkart")))
.filter(col(CRAWL_PINCODE).equalTo(lit("502307")))
.filter(col(COMP_SKU).isNotNull)
.filter(col(PRODUCT_ID).isNotNull)
.filter(col(FSN_DISPLAYED_PRODUCT_PRICE).isNotNull)
.filter(col(COMP_SELLER_PRODUCT_PRICE).isNotNull)
.filter(col(CRAWL_TIMESTAMP).isNotNull)
.select(
col(COMP_SKU).as(SKU),
col(PRODUCT_ID).as(PRODUCT_ID),
)
)
col(COMP_SELLER_PRODUCT_PRICE).as (MEESHO_SELLING_PRICE), date_format(col(DATE_KEY), "yyyyMMdd").as (DATE_KEY)
.withColumn(ROW_NUM, row_number().over(meeshoWindow))
.filter(col(ROW_NUM).equalTo(lit(1)))
.select(
col(SKU),
col (PRODUCT_ID),
col (MEESHO_SELLING_PRICE),
col (DATE_KEY)
val productWindow = Window.partitionBy(col(SKU)).orderBy(col(DATE_KEY).desc)
val datasetName = config.getValueAs [String] ("meesho.product.level.fact.dataset.name")
val actowizData = MeeshoDailyDataHelper.getDataFromDataset (ss, datasetName)
val mergedData = MeeshoDailyDataHelper.merge(meeshoData, actowizData)
val lhdDF = ss.executeQuery(ListingHiveDimQuery)
val sellerHiveDF = ss.executeQuery(SellerHiveDimQuery)
val meeshoProductDetails = ss.executeQuery(MeeshoProductDetailsFactQuery.build())
withColumn(ROW_NUM, row_number().over(productWindow))
.filter(col(ROW_NUM).equalTo(lit(1)))
select(
)
.select(
col(SKU),
col(IMG_URL),
col(URL_TO_PROD)
val meeshoDataDf = mergedData
)
.join(meeshoProductDetails, meeshoProductDetails(SKU).equalTo(mergedData(SKU)), JoinTypes.INNER)
.select(
mergedData(SKU).as (MEESHO_SKU),
mergedData (PRODUCT_ID),
mergedData (MEESHO_SELLING_PRICE),
ergedData(DATE_KEY),
meeshoProductDetails(IMG_URL),
meeshoProductDetails(URL_TO_PROD)
val meeshoCiListingDf = meeshoDataDf
join(lhdDF, meeshoDataDf (PRODUCT_ID).equalTo(lhdDF(PRODUCT_ID)), JoinTypes.INNER)
.join(sellerHiveDF, sellerHiveDF(SELLER_ID).equalTo(lhdDF (SELLER_ID)), JoinTypes.LEFT)
.select(
1hdDF (LISTING_ID),
1hdDF (FLIPKART_SELLING_PRICE).cast(INT),
1hdDF(PRODUCT_ID),
}
lhdDF (PRODUCT_ID),
lhdDF(SKU),
meeshoDataDf (MEESHO_SKU).as (MEESHO_SKU),
meeshoDataDf (MEESHO_SELLING_PRICE).cast(INT),
meeshoDataDf(IMG_URL),
meeshoDataDf (URL_TO_PROD),
sellerHiveDF(DARWIN_TIER).as (SELLER_TIER),
lhdDF (SELLER_ID).as (SELLER_ID),
meeshoDataDf (DATE_KEY).as (FACT_DATE)
.filter(col(MEESHO_SELLING_PRICE).isNotNull.and(col(MEESHO_SELLING_PRICE).gt(0)))
.filter(col(FLIPKART_SELLING_PRICE).isNotNull)
.filter(col(MEESHO_SELLING_PRICE).gt(col(FLIPKART_SELLING_PRICE).multiply(meeshoDrop)))
withColumn(NEW_PRICE,
when (col (MEESHO_SELLING_PRICE).gt(ceil(col(FLIPKART_SELLING_PRICE).multiply(meeshoConstraint))),col(MEESHO_SELLING_PRICE))
.otherwise(ceil(col(FLIPKART_SELLING_PRICE).multiply(meeshoConstraint)))
.drop(col(MEESHO_SELLING_PRICE))
withColumn (MEESHO_SELLING_PRICE, col(NEW_PRICE))
.filter(col(MEESHO_SELLING_PRICE).lt(col(FLIPKART_SELLING_PRICE)))
.drop(col(NEW_PRICE))
val fdpSinkConfig = FdpHiveSinkConfig(DatasetConfigDetails.MEESHO_PRODUCT_LEVEL_FACT, WriteMode.OVERWRITE)
meeshoCiListingDf.writeToFdpSink(fdpSinkConfig)
override def jobName(); String = "Meesho ProductsGenerationJob"
}