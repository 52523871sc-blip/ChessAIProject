Auth Backend

Requirements
- Java 17 or later
- Maven 3.9+

Build
- mvn -q -DskipTests package

Run
- mvn spring-boot:run
- Service: http://localhost:8080

Database
- H2 file database at ./data/authdb
- Console: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:file:./data/authdb
- Username: sa
- Password: (empty)

Configuration
- Edit src/main/resources/application.properties for port and DB settings

API
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/profile/me
- PUT  /api/profile/me
- Authorization: Bearer <token>

Notes
- Tokens are stored in memory and reset on server restart
