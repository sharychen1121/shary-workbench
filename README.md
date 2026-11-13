# shary 的工作台

个人目标与运动健康工作台。GitHub Pages 提供 HTML/CSS/JavaScript 前端；运动健康自动同步使用单独的 Cloudflare Worker + D1 后端和 iPhone HealthKit 配套 App。

任务、目标、复盘与习惯保存在访问者当前浏览器的 localStorage。健康日汇总与训练摘要在用户授权后由 iPhone App 通过 HTTPS 写入 Cloudflare D1；网页通过同步密钥读取。健康同步部署步骤见 [SYNC_SETUP.md](SYNC_SETUP.md)，iPhone 项目位于 [ios/SharyHealthSync.xcodeproj](ios/SharyHealthSync.xcodeproj)。

GitHub Pages 自动从 main 分支发布静态前端。Worker 与 iPhone App 需要分别配置和部署。
