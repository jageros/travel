# Cedar Trips 接下来做什么

计划维护日期：2026-11-17。以 **2026-10-20 首发**为经营起点；先重新核对 [当前交接](README.md) 中的日期快照。以下是计划，不能写成已经完成。

## 当前执行顺序：自动发布机制

自动发布代码已提交到 `main` 的 `0b946d2`，required CI 和 Cloudflare build check 已成功。活动版本、流量分配和生产 SHA 仍需继续核对。后续维护顺序如下。

1. 通过普通代码 PR 交付 workflow、pipeline、测试和文档改动，保持当前 main 的生产构建门禁。
2. 在 GitHub Actions 中确认 workflow token 可以写入 `main`，并确认 `DRAFT_API_KEY`、`DRAFT_MODEL`、允许的 API host 和 Cloudflare 部署链路已经配置。
3. 首次自动运行只观察 source snapshot、pipeline report、队列和提交竞态结果。来源 changed 只有在 evidence 全部存在且没有人工事实时自动推进；其他项目保持 hold。
4. 首次成功提交后单独核对 Cloudflare 生产 SHA、活动版本、HTTP、canonical、sitemap 和未知路径 404。自动提交不等于生产部署完成。
5. 后续运行按真实导入的 Search Console 数据为 `ready` 主题排序，每次最多生成和发布一篇，并继续执行七天三篇配额、来源新鲜度、事实有效期、重复和构建门禁。

Search Console 自动选题目前使用版本库中的真实导入 JSON。要获取新的点击数据，仍需通过授权流程导入新的 Queries CSV；仓库没有自行登录 Search Console 的凭证或 API 集成。

## 第一优先：来源阻塞和当前部署

1. 读取最新 main、editorial run、source snapshots、待审队列和对应部署，确认自动任务是否已跑。不要重复 dispatch 或将旧失败再次当成故障。
2. 让自动 workflow 逐项读取当前 changed 来源的完整捕获，比较登记 evidence 和受影响事实。哈希变化只有在抓取成功、evidence 全部存在且来源没有人工事实时自动推进；其他情况记录具体阻塞。
3. 保留逐项事实—来源—捕获 hash—检查日期—影响—处理结果的报告。事实冲突、不可用、人工来源过期保持 hold，不自动续期。
4. 尤其处理 `sfmta-f-line`：它直接影响已有 SFO、滨水区内容和下一篇候选。生产精确信息按现有健康机制抑制；不要在没有证据时宣称停运或改价，也不盲目覆盖已发布正文。
5. 实际验证最新 Cloudflare 活动版本与合并 SHA；至少抽查一篇正式指南的官方事实、内链、照片许可、HTTP、canonical、sitemap、未知 404。只读抓取不制造 GA 自然流量。

验收：当前来源报告与自动处置有可追溯记录，未通过 evidence 门禁的 hash 继续阻塞；实际部署证据与当前 main 对齐。

## 第二优先：交付已有 review 成果，继续约十三篇的主题集

先处理 [pending](pending/README.md) 的 cable car / historic streetcar review 与查询词 JSON：

- 从最新 main 取得候选文本；检查目标文章/数据是否已被自动流程提交，避免覆盖。
- 按当前官方来源和事实门禁生成或修订稿件，检查与 Muni 通票、BART/Muni 和滨水区现有页的独立增量。自动稿保留精确 digest，发布前重新计算。
- 仅在不存在更新的真实导出时采用保存的 10 条查询词；新导出优先，保留日期范围。搜索信号很小，不据此声称竞争低或有稳定需求。
- 重新跑内容、类型、测试、双构建；自动 workflow 在生产验证通过后提交 `main`，不能引用 11 月 2 日本地检查代替远端结果。
- 来源、事实有效期、质量、重复和滚动配额都过关后自动发布；发布后检查生产正文、内链和 sitemap，不手改 status。

当前 6 篇 + 下列 7 个独立简报 = 约 13 篇潜在主题集；`ready` 仅说明简报存在，不能覆盖来源门禁：

| 简报 slug | 独立读者任务 | 眼前限制 |
| --- | --- | --- |
| `sf-cable-car-vs-historic-streetcar` | 识别想乘的车辆、匹配目的地与上车点 | 已准备 review 文本；F-line 来源 changed |
| `sf-waterfront-step-free-transit-planning` | 按上下车站、方向和临时站点逐段核对无台阶行程 | 不承诺端到端 accessible；部分来源 changed |
| `sf-transit-with-children-fare-planning` | 分别核对 BART/Muni 的儿童/青少年资格与证明 | 核对当前官方年龄/身份要求，避免成人公式套全家 |
| `sfo-late-arrival-transit-fallbacks` | 晚到机场时验证末班连接及官方替代上车区 | 不给未经核验的末班时刻或车价；多项 BART 来源 changed |
| `sf-contactless-transit-payment-declined` | 支付被拒时按官方步骤排查并找站务协助 | 区别设备/卡身份、发行行 hold；部分来源 changed |
| `sausalito-without-car-return-ferry-or-bus` | 出发前比较渡轮与公交返程 | 两条人工事实已过期；必须重新操作官方方向/日期控件核验 |
| `sf-transit-disruption-backup-plan` | 用官方公告和 planner 修订中断后的行程 | 当前多个公告/planner 来源 changed，先审来源 |

`sf-airport-arrival-checklist`、`golden-gate-bridge-transit-checklist`、`sf-adult-group-contactless-payments` 三个重叠简报继续 `needs-editorial-assessment`，优先并入已有答案，不为了数量另发相似页面。新内容继续使用决策表、比较/计算示例、下一步内链和许可明确的真实照片；不虚构亲历。

## 每周：用同口径数据改进内容

- Search Console：读取真实可用日期的收录、曝光、查询词、点击、目标页面和设备/国家。对有持续曝光且答案确有缺口的已有页优先修订；现有 SFO 页面为最早可见信号，但样本不支持激进改题或重复铺页。
- GA4 property 559805493：观察自然搜索落地页、后续浏览、站内导航/搜索和阅读深度。无自然搜索 cohort 或后台 processing 就记未可用/无法评估，不作零需求结论。
- 每周抽查至少一篇已发布攻略；检查事实、来源新鲜度、正文链接和照片许可，轮换高变化项。检查移动性能；实验室数值和真实用户 Core Web Vitals 分别记录。
- 数据导出原件留 ignored artifacts；版本库只保存必要日期/汇总/编辑输入与结论。记录改动前后窗口，不用事件量充当读者数，不混合属性/页面/查询词聚合。
- 通过普通 PR 交付实质改进；按实际成本和收入文件记账，尚未能取得则明确缺失。无新可行动信号时不重复通知权限问题或正常运行。

## 后续阶段与收入

- **第 31–60 天**：优先实际查询词和落地页信号，完善已获曝光的内容，再扩展有独立增量的子问题。第 31 天约为 11 月 19 日，届时重新评估数据，不按日历自动增加发布量。
- **第 61–90 天**：约 12 月 19 日起评估并准备广告申请资料，检查原创实用性、关于/编辑/联系/隐私/广告说明、照片与来源记录。是否获批由平台决定，十三篇不是获批门槛或保证。
- 广告账号、条款、身份、支付、publisher ID 和真正启用必须由用户提供/完成。获批并明确同意后才配置真实广告位、ads.txt、同意管理；当前 `ADSENSE_READY=false` 保持不变。
- 有足够实际样本后一次测试一个广告变量；Page RPM 用广告平台匹配口径页面浏览量，另列每千 session 收入；净收益扣除对应时期实际内容/托管/工具成本。不把 GA 的零收入字段当成广告报表。
- 保留 **90 天约 30–40 篇合格攻略**的建设目标，受质量、来源、配额和维护能力限制，不保证排名/流量/收入。免费工具优先；付费模型、凭证、预算、权限扩张都不是本计划默认授权。

## 每次完成工作的交接要求

更新 [当前交接](README.md) 的实际核验时间、main/PR head、测试范围、真实部署和数据日期；向 [history](history.md) 追加结果；下一步写明可执行动作及阻塞。保留原审批账本和历史验收，不把预计时间、auto-merge 请求或本地成功标记为远程完成。
