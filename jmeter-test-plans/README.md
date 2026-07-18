# JMeter Performance Testing for Incident Management System

This directory contains JMeter test plans for performance testing the IMS Backend APIs.

## Test Plans

### 1. IMS_Performance_Test.jmx
**Purpose**: Basic performance testing with moderate load
- **Login Test**: 150 threads, 100 iterations, 30s ramp-up
- **Incident Operations**: 100 threads, 50 iterations, 20s ramp-up  
- **Dashboard/Reports**: 80 threads, 100 iterations, 15s ramp-up

### 2. IMS_Load_Test.jmx
**Purpose**: High-volume load testing
- **Heavy Load**: 250 threads, 200 iterations, 60s ramp-up
- **Concurrent Reads**: 150 threads, 500 iterations, 45s ramp-up

## API Endpoints Tested

### Authentication
- `POST /api/auth/login` - User authentication

### Incident Management
- `GET /api/incidents` - List incidents with pagination
- `POST /api/incidents` - Create new incident
- `GET /api/incidents/{id}` - Get incident details

### Dashboard & Reports
- `GET /api/incidents/dashboard/kpi` - Dashboard KPIs
- `GET /api/categories` - Get categories
- `GET /api/users/by-role/{roleCode}` - Get users by role

## Prerequisites

1. **JMeter Installation**: Download and install Apache JMeter 5.6+
2. **Backend Running**: Ensure IMS Backend is running on `http://localhost:8080`
3. **Database Setup**: MySQL database should be properly configured

## Configuration

### Test Variables
- `BASE_URL`: `http://localhost:8080`
- `ADMIN_USERNAME`: `admin`
- `ADMIN_PASSWORD`: `Admin@123`

### Authentication
- Tests automatically login and extract JWT tokens
- Tokens are used for subsequent API calls

## Running Tests

### Using JMeter GUI
1. Open JMeter
2. File → Open → Select `.jmx` file
3. Click "Run" button (green triangle)

### Using Command Line
```bash
# Performance Test
jmeter -n -t IMS_Performance_Test.jmx -l results_performance.jtl

# Load Test  
jmeter -n -t IMS_Load_Test.jmx -l results_load.jtl

# Generate HTML Report
jmeter -g results_performance.jtl -o performance_report/
jmeter -g results_load.jtl -o load_report/
```

## Test Scenarios

### 1. Authentication Performance
- Tests login endpoint performance under concurrent load
- Validates JWT token extraction
- Measures response times and throughput

### 2. Incident CRUD Operations
- Creates incidents with random data
- Retrieves incident lists with pagination
- Tests incident detail retrieval

### 3. Dashboard Performance
- Tests dashboard KPI loading
- Validates category and user data retrieval
- Measures concurrent read performance

## Performance Metrics

### Key Indicators
- **Response Time**: Average, median, 90th percentile
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **CPU/Memory Usage**: Monitor during test execution

### Success Criteria
- Response time < 2 seconds for most endpoints
- Error rate < 1%
- Throughput: 50+ requests/second for read operations
- Throughput: 20+ requests/second for write operations

## Test Data

### Incident Creation
- Random titles using thread/iteration numbers
- Random priorities (HIGH, MEDIUM, LOW, CRITICAL)
- Random category IDs (1-10)
- Standardized descriptions

### Search Variations
- Different page numbers (0-5)
- Various page sizes (10, 20, 50)
- Search terms: test, incident, issue, problem

## Troubleshooting

### Common Issues
1. **Connection Refused**: Ensure backend is running
2. **Authentication Failures**: Check credentials in test plan
3. **Database Errors**: Verify database connectivity
4. **Memory Issues**: Increase JMeter heap size

### JMeter Configuration
```bash
# Increase heap size for large tests
jmeter -Jheap=4096 -n -t IMS_Load_Test.jmx
```

## Results Analysis

### Reports Generated
- **Summary Report**: Overall performance metrics
- **Aggregate Graph**: Response time visualization
- **View Results Tree**: Detailed request/response data

### Key Metrics to Monitor
- Average response time per endpoint
- Throughput (requests/second)
- Error percentage
- Response time distribution

## Customization

### Adding New Tests
1. Clone existing thread group
2. Modify HTTP samplers for new endpoints
3. Update authentication headers if needed
4. Add assertions for validation

### Load Adjustment
- Modify thread count in thread groups
- Adjust ramp-up time
- Change iteration count
- Add timers for realistic delays

## Best Practices

1. **Warm-up**: Run small test first to verify setup
2. **Monitoring**: Monitor system resources during tests
3. **Isolation**: Run tests on dedicated environment
4. **Repetition**: Run tests multiple times for consistency
5. **Documentation**: Record test parameters and results
