# OpenClaw Playbook for Developers

## Practical Guide for AI Automation & DevOps Workflows

Author: Daniel\
Language: Vietnamese (technical examples remain in English)

------------------------------------------------------------------------

# 1. Mục tiêu tài liệu

Playbook này hướng dẫn **cách sử dụng OpenClaw trong thực tế** cho:

-   automation engineer
-   devops engineer
-   backend developer
-   indie game developer

Nội dung tập trung vào:

-   workflow automation
-   devops tasks
-   CI/CD orchestration
-   data pipelines
-   system operations

------------------------------------------------------------------------

# 2. Mindset khi dùng OpenClaw

Sai lầm phổ biến:

    AI hãy làm tất cả cho tôi

Cách đúng:

    human designs workflow
    AI executes tasks

OpenClaw hoạt động tốt nhất khi:

-   task rõ ràng
-   tools giới hạn
-   steps nhỏ

------------------------------------------------------------------------

# 3. Template Prompt Chuẩn

Prompt template cho OpenClaw:

    Goal:
    <task description>

    Tools allowed:
    <list tools>

    Steps:
    <step-by-step plan>

    Constraints:
    <safety rules>

    Output:
    <expected result format>

------------------------------------------------------------------------

# 4. Workflow 1 --- Repository Automation

Goal:

    Update dependencies for a project

Workflow:

    git clone repository
    ↓
    scan dependency versions
    ↓
    update outdated packages
    ↓
    run tests
    ↓
    commit changes

Example command:

    npm update

------------------------------------------------------------------------

# 5. Workflow 2 --- CI/CD Deployment

Goal:

    Deploy backend service

Workflow:

    clone repository
    run tests
    build docker image
    push registry
    deploy kubernetes
    run health checks

Example:

    docker build -t backend-service .
    kubectl apply -f deployment.yaml

------------------------------------------------------------------------

# 6. Workflow 3 --- Log Analysis

Goal:

    Identify production errors

Workflow:

    collect logs
    detect error patterns
    group exceptions
    generate summary

Example command:

    kubectl logs api-service

------------------------------------------------------------------------

# 7. Workflow 4 --- Data Processing

Goal:

    Process CSV dataset

Workflow:

    load file
    clean data
    transform format
    export results

Example:

    python process_data.py input.csv

------------------------------------------------------------------------

# 8. Workflow 5 --- System Monitoring

Goal:

    Detect service anomalies

Workflow:

    check metrics
    detect spikes
    trigger alert
    run remediation

Example metrics:

    cpu_usage
    memory_usage
    error_rate

------------------------------------------------------------------------

# 9. Workflow 6 --- Self-Healing Infrastructure

Incident:

    service crash

Automation:

    detect crash
    restart container
    verify health check

Example:

    kubectl rollout restart deployment api

------------------------------------------------------------------------

# 10. Workflow 7 --- Backup Automation

Goal:

    Backup database daily

Workflow:

    dump database
    compress file
    upload storage
    verify backup

Example:

    pg_dump database > backup.sql

------------------------------------------------------------------------

# 11. Workflow 8 --- Security Scan

Goal:

    Scan repository for vulnerabilities

Workflow:

    scan dependencies
    detect vulnerabilities
    generate report

Example:

    npm audit

------------------------------------------------------------------------

# 12. Workflow 9 --- Codebase Analysis

Goal:

    Summarize architecture

Workflow:

    scan repository
    identify modules
    generate architecture summary

Example:

    analyze directory structure

------------------------------------------------------------------------

# 13. Workflow 10 --- Game Dev Automation

Goal:

    Build game client

Workflow:

    pull latest code
    build project
    export build
    upload artifact

Example:

    godot --export-release

------------------------------------------------------------------------

# 14. DevOps Agent Template

System prompt:

    You are a DevOps automation engineer.

    Responsibilities:
    - monitor services
    - deploy applications
    - run system checks

    Rules:
    - never deploy if tests fail
    - always verify health checks

------------------------------------------------------------------------

# 15. Data Engineer Agent Template

    You are a data automation agent.

    Tasks:
    - process datasets
    - transform files
    - generate reports

------------------------------------------------------------------------

# 16. Research Agent Template

    You are a research automation agent.

    Tasks:
    - collect web data
    - summarize insights
    - generate reports

------------------------------------------------------------------------

# 17. Best Practices

1.  Chia task nhỏ

```{=html}
<!-- -->
```
    small steps → reliable automation

2.  Giới hạn tools

```{=html}
<!-- -->
```
    3–5 tools per agent

3.  Giới hạn step

```{=html}
<!-- -->
```
    max_steps = 10

4.  Luôn verify output

------------------------------------------------------------------------

# 18. OpenClaw + Claude Code Integration

Best workflow:

    Claude Code → generate code
    OpenClaw → execute automation

Example:

    Claude Code writes CI pipeline
    OpenClaw runs CI pipeline

------------------------------------------------------------------------

# 19. Production Architecture Example

``` mermaid
flowchart TD

A[Monitoring]
B[Incident Detection]
C[OpenClaw Agent]
D[Automation Tasks]
E[Infrastructure]

A --> B
B --> C
C --> D
D --> E
```

------------------------------------------------------------------------

# 20. Checklist Before Running Agent

Before running OpenClaw:

    Is task small?
    Are tools limited?
    Are steps defined?
    Is output clear?

------------------------------------------------------------------------

# 21. Kết luận

OpenClaw mạnh nhất khi dùng cho:

    automation
    devops workflows
    data pipelines
    system operations

Không nên dùng OpenClaw cho:

    complex coding
    architecture design

Kết hợp với Claude Code sẽ tạo hệ:

    AI coding + AI automation

------------------------------------------------------------------------

End of OpenClaw Playbook
