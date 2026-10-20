# 官方来源语义复核记录：2026-10-20

本记录由本次 AI 协助研究根据实际打开的官方网页整理；它是来源研究记录，不代表用户已完成首五篇人工审核、作者亲历、发布批准或生产部署验收。未调用付费模型，未发布或提交代码。核查日期按 Asia/Shanghai 为 2026-10-20。

## 来源及本次可采用范围

原有 10 个来源、9 条动态事实均已逐页阅读。为避免把旧访桥指南当作当前线路权威，补登记一个当前时刻表来源；现为 **11 个来源、9 条动态事实**。

| 来源 ID / 官方页面 | 本次核查结论及边界 |
| --- | --- |
| `bart-sfo` — [BART Airport Connections](https://www.bart.gov/guide/airport/sfo) | SFO 站在 International Terminal；免费 AirTrain 可连接各航站楼。BART 要求进出使用同一支付凭证，每位符合付费年龄的乘客需要独立卡或设备。不把机场到市中心的说明等同于到酒店的完整无步行路线。 |
| `sfmta-fares` — [SFMTA Fares](https://www.sfmta.com/getting-around/muni/fares) | 用于产品对比和跨机构优惠入口；页面的 MuniMobile 单程销售提示与单程产品页不一致，处理见下。该页可显示暂时无法加载实时 alerts，不能因此推断没有中断。 |
| `sfmta-adult-single` — [Adult Single Ride](https://www.sfmta.com/fares/single-ride-adult-ages-19-64) | Clipper 与直接刷信用卡/借记卡的成人票价表均为 $2.85；现金/Metro 售票机为 $3。普通公交和轻轨单程适用 120 分钟规则；不是 cable car 或跨机构无限乘车权。Muni Metro 不要求出站 tap，不能把 BART 的规则推广给 Muni。 |
| `sfmta-day-pass` — [Day Pass](https://www.sfmta.com/fares/day-pass) | 普通 Day Pass 为 $5.70，列明公交、列车和历史有轨电车的无限次使用，至当日 23:59；所列覆盖不含 cable car。可在 MuniMobile 或 Clipper 预购，也可在车辆 farebox 用现金购买，投币前通知司机。不沿用“Clipper 不销售 Day Pass”的旧说法。 |
| `sfmta-visitor-passport` — [1-Day Visitor Passport](https://www.sfmta.com/fares/1-day-visitor-passport) | 价栏列 MuniMobile / Paper Passport / Clipper 为 $15；Muni-only 且包含 cable cars，排除 BART、其他运输机构及 SFO 机场交通。页面提及 kiosks、Clipper 和 sales locations；MuniMobile 折扣旧句不能推翻同页价格表，故不承诺渠道优惠。 |
| `sfmta-f-line` — [F Market & Wharves](https://www.sfmta.com/routes/f-market-wharves) | 入向 Wharf 站表包含 Ferry Building、Pier 39、Jefferson/Powell、Jefferson/Taylor、Jones/Beach；返程站序不同。只能作为旅行日规划候选，不能保证每一班运行、实时到站或每个酒店无步行接驳。 |
| `sfmta-f-access` — [Historic Streetcar Access](https://www.sfmta.com/getting-around/accessibility/muni-accessibility/muni-access-guide/access-historic-streetcars) | 页面区分不同车辆与站台设备；需查具体方向的上、下车站和设备状态，不能用 F 线经过某地推断全程无台阶。网页工具该页标为两日前抓取；本次另由机器直接请求核验其抓取状态。 |
| `golden-gate-transit` — [Bridge Public Transit](https://www.goldengate.org/bridge/visiting-the-bridge/public-transit/) | 可用于桥南、北端和 Toll Plaza 位置概览。它仍写已被替换的 Routes 130 / 150，因此不用于确认当前路线编号、班次或北端下车站，详见冲突处理。 |
| `golden-gate-sidewalks` — [Bikes & Pedestrians](https://www.goldengate.org/bridge/visiting-the-bridge/bikes-pedestrians/) | 行人（含轮椅使用者）仅可用东侧步道。季节时间和临时关闭必须按旅行日复核；不把骑行的夜间通行规则当成行人全天开放，不根据旧施工 banner 断言今日提前关闭。 |
| `clipper-contactless` — [Contactless Bank-card Payments](https://www.clippercard.com/contactless-payments) | 每人独立银行卡或设备；要求进出双 tap 的机构须始终用同一张卡或同一设备。银行卡付成人票，不承接 Youth / Senior / Access / START 身份项目折扣；这与可能适用的跨机构换乘优惠是两件事。 |
| `golden-gate-current-schedules` — [Current Bus Schedules](https://www.goldengate.org/bus/schedules-maps/) | 新增来源；目录标示当前生效日为 2026-09-13，并列 101 / 120 等线路。具体日期、方向、停站仍须以对应时刻表/规划器确认；没有把 120 北端下车站或回程连接写成已验证事实。 |

## 矛盾与处理

1. **MuniMobile 的单程购买渠道。** 票价总页明确提示该渠道自 2026-09-01 停售 Single Ride；单程产品页仍保留 MuniMobile 名称和旧宣传。进一步打开 [MuniMobile 专门更新页](https://www.sfmta.com/getting-around/muni/fares/munimobile)，其 2026-08 更新及 FAQ 确认单程停售，且普通 Day Pass 不含 cable car、Day Pass / Visitor Passport 在 2026 年仍列为 app 产品。注册票价事实限于 Clipper / contactless 成人价，不推荐 app 单程，避免旧产品标题造成误导。专页另有 app 逐步退出、国际账号和部分外卡限制；列出购买渠道不代表保证每位国际用户开户或支付成功。未将未来拟议退出日期加入现有事实。
2. **Passport 渠道折扣。** Passport 页面仍有 MuniMobile 优惠句，但同页产品价栏把三个渠道列为 $15。记录页面当前表价，不声称某渠道更便宜；购买前仍应确认产品和销售界面。此处没有证明实际支付界面已核验。
3. **银行卡并非没有任何优惠。** Clipper 官方 FAQ 允许在同一行程中使用同一 contactless 或 Clipper 凭证取得适用的跨机构换乘优惠，写的是最高可省 $2.85；SFMTA 总页也区分银行卡 / Clipper 与 MuniMobile。不能把专用身份优惠不可用改写成所有换乘优惠不可用，也不能保证任意组合一定免费。总页的完整优惠链接实际跳回单程页，故本次不新增具体跨机构优惠金额、所有机构覆盖或必减额度事实。
4. **访桥旧路线。** [2026-04 官方服务变更](https://www.goldengate.org/golden-gate-transit-april-2026-service-changes/) 明确 130 / 150 被 120 替代；当前时刻表目录亦不列旧两线。保留旧访桥来源的端口概览用途，新增当前目录并通知文章作者优先链接。正文不写旧编号，也不根据不完整的 JS 时刻表推断新线全部停站。
5. **步道提前关闭提示。** 步道页 banner 链到 [Temporary Weeknight Lane Closures](https://www.goldengate.org/ggb-temporary-weeknight-lane-closures/)；该页更新称相关工程 lane closures 于 2026-01-23 结束，后面仍保留一月日程。[当前 alerts](https://www.goldengate.org/service-alerts/) 亦包含有明确日期范围的其他运输中断。不能从旧 banner 或不存在的即时提醒推出今日行人开放保证；仅保留东侧步道与旅行日复核条件。

## 注册事实、日期与审核边界

保留原 9 个 fact ID。单程换乘事实限于普通 Muni bus / light rail；支付事实只在需要双 tap 的机构要求出站同凭证；F 线和桥交通事实均明确不等于实时运行/通行保证。价格、覆盖和购买渠道留在可过期的注册事实中，正文不硬编码动态数字。

逐页语义核查日期更新为 2026-10-20，动态事实复核期限为 2026-10-27。期限不是七天运行承诺；来源变化、不可达、证据消失时，现有门禁仍应 hold。注册表中的研究日期不能代替来源监测器的成功记录或人工文章批准。

## 机器抓取与初始基线

初始注册表没有任何 `contentHash`。仅在上述研究后运行现有 `scripts/check-sources.mjs --accept-baseline` 采集缺失基线；不会删除或自动接受已有变更 hash，不从网页工具的摘要拼装基线。

本机沙箱默认请求指向不可用的本机代理；沙箱内直连无法解析，受审批直连又出现 TLS 连接失败。受审批使用本机已配置代理的 curl 已获得 SFMTA 官方 HTTP 200。Node 24 的本地帮助确认支持 `--use-env-proxy`，因此实际采集使用 `node --use-env-proxy scripts/check-sources.mjs --accept-baseline`；不关闭 TLS 验证。

实际结果：

| 实际运行 | 结果 |
| --- | --- |
| 首次 CLI，报告开始时间 `2026-10-20T09:54:10.413Z` | 5 / 11 成功取得初始基线；6 个来源不可达，退出码 2。 |
| 同一 CLI 的一次重试，`2026-10-20T10:07:48.578Z` | 9 / 11 成功且未检测到已有基线变化；BART 仍 fetch failed，访桥指南返回 HTTP 504，退出码 2。 |
| 仅重试剩余两源，`2026-10-20T10:10:19.878Z` | 沿用导出的 `checkSources(..., {acceptBaseline:true})`，保留其余九源结果；访桥指南成功，BART 仍失败。最终 **10 / 11 有真实基线**。 |

最终 `automation/source-health.json` 保留 10 个 `unchanged` 和一个 `bart-sfo: unavailable (fetch failed)`，`conflicts: []`；`automation/sources.json` 的 BART 记录仍没有 `contentHash`。初始基线被该工具标作 `unchanged` 只代表本次通过初始采集，不是证明网站此前从未改动。已有 hash 没有被删除或自动替换；所有 evidence 文本保持原值，成功读取的来源未触发证据消失冲突。

BART 的只读 Node 诊断得到 `ECONNRESET`，含义是 TLS 安全连接建立前连接已断开；curl 亦遇 `SSL_ERROR_SYSCALL`。没有得到证书验证失败证据，因此没有以关闭 TLS、替换证书校验或伪造网页摘要的方式放行。其他失败来源在相同校验规则下真实重试后恢复。当前网络结果不能代替独立运行环境的实测；BART 需要在可达的网络或 GitHub runner 再由相同检查器采集，引用它的文章继续受来源门禁约束。

完整最终报告另写入 `automation/reports/source-check.json`，定向重试原结果保存为 `automation/reports/targeted-source-retry-2026-10-20.json`（reports 为运行产物，不作为网页内容）。检查器还按原有行为记录了真实失败队列；历史失败项不等于最终仍有六源失效，解决队列时应以当前 source-health 和本记录复核，不抹去真实尚存的 BART 失败。

本轮 `node scripts/validate-content.mjs` 通过，覆盖当前 5 篇审核稿。没有创建文章批准或发布记录。末次定向重试已完成，没有留待轮询的进程；此后停止本机来源重试，避免与独立 runner 的结果竞写。

## 独立 runner 复核与问题关闭

随后在 GitHub Actions 的正常 Node 网络环境运行了[来源监测任务](https://github.com/jageros/travel/actions/runs/39408017360)，仅明确启用缺失基线采集，未请求生成、批准或发布文章。`2026-10-20T10:27:18.071Z` 的报告为 **11 / 11 unchanged、conflicts=[]**；BART 原文成功采集，其初始 SHA-256 为 `6e47386934ab24578646995df7f4d9551c949f7860f31fa66822f532db7d4edb`。其余十个已接受的基线没有被替换。

任务实际创建了[来源健康 PR #4](https://github.com/jageros/travel/pull/4)，[显式触发的 CI](https://github.com/jageros/travel/actions/runs/39408088331)成功，原 PR 事件的工作流经维护者批准后也成功。PR #4 已合并；当前版本化来源健康以该完整 runner 结果为准，前文的本机失败保留为诊断历史。相关七条网络失败待审项据此关闭，不将它们继续显示为尚未解决的来源故障。文章人工批准仍是独立条件。
