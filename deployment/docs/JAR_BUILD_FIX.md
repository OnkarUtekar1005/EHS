# JAR Build Fix - "No Manifest Attribute" Error

## Problem
When running `java -jar EHS-0.0.1-SNAPSHOT.jar`, you get:
```
no main manifest attribute, in EHS-0.0.1-SNAPSHOT.jar
```

## Root Cause
The `pom.xml` file was missing the Spring Boot Maven plugin in the `<build>` section, which is required to create an executable JAR file.

## Solution

### 1. Update pom.xml (ALREADY FIXED)
The `pom.xml` has been updated with the correct build configuration:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 2. Rebuild the JAR
```cmd
# Navigate to backend directory
cd "path\to\EHS\EHS"

# Clean previous builds
mvn clean

# Build executable JAR
mvn package -DskipTests

# The JAR will be created at: target/EHS-0.0.1-SNAPSHOT.jar
```

### 3. Verify the JAR
```cmd
# Check if JAR is executable
java -jar target/EHS-0.0.1-SNAPSHOT.jar --version

# Or run normally
java -jar target/EHS-0.0.1-SNAPSHOT.jar
```

## Alternative Build Commands

### If `mvn package` doesn't work:
```cmd
# Try Spring Boot specific goal
mvn spring-boot:build-image

# Or use the repackage goal
mvn spring-boot:repackage
```

### For development testing:
```cmd
# Run without building JAR
mvn spring-boot:run
```

## Verification Steps

### 1. Check JAR Contents
```cmd
# List contents of JAR
jar tf target/EHS-0.0.1-SNAPSHOT.jar | findstr MANIFEST

# Should show: META-INF/MANIFEST.MF
```

### 2. Check Manifest File
```cmd
# Extract and read manifest
jar xf target/EHS-0.0.1-SNAPSHOT.jar META-INF/MANIFEST.MF
type META-INF\MANIFEST.MF

# Should contain:
# Main-Class: org.springframework.boot.loader.JarLauncher
# Start-Class: com.ehs.elearning.EhsApplication
```

### 3. Test JAR Execution
```cmd
# Navigate to target directory
cd target

# Run JAR (should start successfully)
java -jar EHS-0.0.1-SNAPSHOT.jar

# Should see Spring Boot startup logs
```

## Common Issues and Solutions

### Issue 1: Maven Not Found
```cmd
# Check Maven installation
mvn --version

# If not found, install Maven or use wrapper
./mvnw package -DskipTests  # Linux/Mac
mvnw.cmd package -DskipTests  # Windows
```

### Issue 2: Java Version Mismatch
```cmd
# Check Java version
java -version

# Should be Java 17 or higher
# Update JAVA_HOME if needed
```

### Issue 3: Dependency Issues
```cmd
# Clean and reinstall dependencies
mvn clean install -DskipTests

# Or force update
mvn clean install -U -DskipTests
```

### Issue 4: Build Still Fails
```cmd
# Try with verbose output
mvn clean package -DskipTests -X

# Check for specific error messages
```

## Expected JAR Size
The executable JAR should be approximately:
- **Size**: 60-100 MB (includes all dependencies)
- **Type**: Executable Spring Boot JAR
- **Structure**: Contains BOOT-INF/, META-INF/, and org/ directories

## Deployment Steps After Fix

1. **Rebuild JAR** with fixed pom.xml
2. **Copy new JAR** to deployment machine: `C:\deployment\backend\`
3. **Start application** normally:
   ```cmd
   cd C:\deployment\backend
   java -jar EHS-0.0.1-SNAPSHOT.jar
   ```

## Quick Test Script

Create `test-jar.bat` in the target directory:
```batch
@echo off
echo Testing JAR file...
java -jar EHS-0.0.1-SNAPSHOT.jar --help
if %errorlevel% == 0 (
    echo JAR is executable!
) else (
    echo JAR has issues!
)
pause
```

---
**Note**: The pom.xml fix has been applied to your project. Just rebuild the JAR and it should work!