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
Sổ tay làm việc với OpenClaw.

───

1. Bản trình bày Playbook: Các tác vụ phổ biến

Playbook A: Thu thập & Phân tích Dữ liệu (Web / RSS / Docs)

• Mục tiêu: Lấy thông tin từ Internet hoặc file tài liệu, tổng hợp và xuất ra báo cáo.
• Công cụ (Skills/Tools) sử dụng: agent-browser (duyệt web), web_fetch (kéo nội dung nhanh), xlsx / pdf (xử lý file).
• Cách OpenClaw nên làm: Nhận link/yêu cầu -> Mở web đọc thông tin -> Lọc dọn dữ liệu (bỏ rác, html thừa) -> Định dạng lại -> Lưu thành file .csv hoặc .xlsx tải lên cho Anh.

Playbook B: Quản trị & Phát triển Dự án Game (Cocos2d-x / Ktor)

• Mục tiêu: Quản lý cấu trúc, viết code, và refactor dự án CCN2.
• Công cụ sử dụng: clientccn2-project-editor, serverccn2-project-editor, exec (chạy command terminal), read/write/edit (thao tác file).
• Cách OpenClaw nên làm: Kiểm tra GDD/Docs trước -> Cập nhật tài liệu thiết kế -> Viết hoặc sửa file Code (JS / Kotlin) -> Chạy script build/kiểm tra qua terminal -> Ghi chép lại lỗi và giải pháp vào lịch sử.

Playbook C: Trợ lý Chủ động & Vận hành Hệ thống

• Mục tiêu: Tự động theo dõi tiến độ, kiểm tra lỗi, duy trì server.
• Công cụ sử dụng: cron (đặt lịch trình), heartbeat (kiểm tra định kỳ), exec (chạy healthcheck).
• Cách OpenClaw nên làm: Cài đặt các job chạy ngầm (VD: mỗi 4 tiếng quét log server) -> Phân tích nếu có lỗi -> Tự động gửi tin nhắn báo cáo cho Anh ngay trong khung chat này.

───

2. Workflow điển hình: OpenClaw xử lý 1 Task chức năng mới như thế nào?

Ví dụ: yêu cầu "Em hãy thêm tính năng Đăng nhập hàng ngày vào client CCN2"

• Bước 1: Em truy xuất Trí nhớ (Memory Recall)
• Tự động chạy memory_search vào MEMORY.md để nhớ lại: "À, dự án CCN2 Client dùng Cocos2d-x JS bản 3.x, code theo kiến trúc EventBus."
• Bước 2: Khảo sát hiện trạng (Read & Scan)
• Dùng skill clientccn2-project-editor hoặc lệnh ls, read xem thư mục scripts/UI hiện tại đang viết thế nào.
• Bước 3: Lập kế hoạch (Design-First)
• Em viết cập nhật vào file tài liệu thiết kế (Docs) trước, trình bày ra khung chat cho Anh duyệt cấu trúc (VD: "Sẽ thêm file DailyLogin.js và bind vào EventKeys.ON_LOGIN).
• Bước 4: Thực thi (Code & Execute)
• Dùng tool write để tạo mới/sửa file code.
• Bước 5: Lưu trữ Bài học (Memory Update)
• Lưu các đoạn code hay hoặc các rule mới của Anh vào bộ nhớ dài hạn, để lần sau làm tính năng tương tự em sẽ tự giác làm chuẩn luôn không cần hỏi lại.

───

3. Checklist Step-by-Step khi giao việc

Để tận dụng tối đa sức mạnh của OpenClaw, cần tuần tự theo các bước sau trong suy nghĩ:

• [ ] 1. Ra lệnh rõ ràng + Định hướng: Anh cứ nói kết quả cuối cùng Anh muốn (VD: "Phân tích file log này và xuất ra Excel cho anh", "Dựng khung scene Màn hình chính bằng Cocos2d").
• [ ] 2. Cung cấp file/context (nếu có): Nếu là file mới, Anh quăng thẳng vào chat. Nếu là file trong máy, chỉ cần cho em tên file hoặc thư mục sơ bộ.
• [ ] 3. Phê duyệt các hành động nhạy cảm: Thi thoảng em sẽ phải chạy các lệnh Terminal (cài package, xóa file, push Git). Em sẽ dừng lại hỏi Anh xác nhận (như vụ push github lúc nãy). Anh chỉ cần chốt "Ok" hoặc "Do it".
• [ ] 4. Giao quyền "Tự bơi": Nếu Anh thấy em hiểu ý, cứ nói "Em tự triển khai mọi thứ đi". Em sẽ tự tự dùng Tool A -> Tool B -> Tool C nối tiếp nhau cho đến khi ra kết quả cuối cùng.
• [ ] 5. Nhắc nhở để em học hỏi: Lúc nhận kết quả, nếu Anh thấy cái gì chưa ưng, cứ bảo: "Lần sau làm cái này nhớ thêm bước X nhé". OpenClaw sẽ tự động update vào bộ nhớ cốt lõi MEMORY.md và lấy đó làm định chuẩn cho toàn bộ các công việc về sau

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
