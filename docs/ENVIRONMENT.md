# Environment Audit — RailSync

**Audit Date:** 24 October 2026  
**Auditor:** Lead Engineer & Build Agent  
**Host Machine:** Windows 11 (x64)  
**Assessed Courses:** CSC2104 (Java OOP) & CSC2131 (RDBMS Lab), Manipal University Jaipur  

---

## 1. Toolchain & Runtime Versions

| Tool | Installed Version | Path / Executable | Status | Notes |
|---|---|---|---|---|
| **Java Runtime (JRE)** | Java 26.0.2 (2026-07-21) | `java` (on PATH) | Available & Verified | Java HotSpot(TM) 64-Bit Server VM |
| **Java Compiler (JDK)** | javac 26.0.2 | `javac` (on PATH) | Available & Verified | Compiles standard Java without JUC in assessed packages |
| **MySQL Server** | MySQL Community Server 8.0.40 | `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` | Running & Verified | Windows Service `MySQL` is RUNNING |
| **MySQL Client / Shell** | MySQL 8.0.40 CLI | `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` | Verified | Scripts explicitly reference full binary path |
| **Python** | Python 3.14.7 | `python` (on PATH) | Available & Verified | Used for PDF extraction, fixture generation, parity checks |
| **Git** | Git 2.51.2.windows.1 | `git` (on PATH) | Available & Verified | Clean git repository initialized |

---

## 2. Directory Layout & Working Paths

- **Repository Root:** `c:\Soham\Coding\GitHub\RailSync`
- **Documentation Directory:** `c:\Soham\Coding\GitHub\RailSync\docs`
- **Java Source Directory:** `c:\Soham\Coding\GitHub\RailSync\java\src`
- **Java Class Output:** `c:\Soham\Coding\GitHub\RailSync\java\bin`
- **MySQL Script Directory:** `c:\Soham\Coding\GitHub\RailSync\mysql`
- **Test Fixture Directory:** `c:\Soham\Coding\GitHub\RailSync\fixtures`
- **Evidence Output Directory:** `c:\Soham\Coding\GitHub\RailSync\evidence`

---

## 3. Environment Specific Execution Policies

1. **MySQL Invocation on Windows:**
   Because `mysql` may not be registered in the user's default PowerShell PATH variable, all automated scripts and gate runners must execute via the absolute binary path:
   `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`
2. **Java Compilation Flags:**
   Assessed core domain packages must compile with standard warnings enabled:
   `javac -Xlint:all -d bin (Get-ChildItem -Recurse src/*.java)`
3. **No External Network Dependencies:**
   All builds and tests operate in full offline mode against local in-memory structures and local MySQL service.
