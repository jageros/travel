# Sausalito 公交／渡轮返程：独立来源核查

核验日期：2026-10-21。方式：官方网页检索、Chrome 中真实加载并操作官方查询控件；只读研究，未修改来源注册、主题状态、文章或发布记录。

## 结论与当前边界

原来的来源缺口已经取得实质证据：现行 Sausalito 公交候选是 **Route 120**，回 San Francisco 应核对 **Southbound**，其 Sausalito timepoint 为 **Bridgeway & El Portal**。去程 Northbound 的 timepoint 是 **Bridgeway & Bay St**，不能照搬为回程站。

渡轮页面实际加载了 **Sausalito Ferry Landing ↔ San Francisco Ferry Building** 以及工作日／周末与假日视图。该工具没有任意旅行日期的日历输入；应先判定旅行日期适用的服务类别，再查假日和临时通知。目前工作日存在机械问题临时表，不能直接将同页常规时刻表当作当前执行表。

这些结论尚未被写成自动可续期的注册事实。主题继续保持现有 hold，等待根代理审核事实的登记与复核方式；本文不确认任何具体日期最后一班、容量、票务预留或无障碍路径。

## 公交：现行线路与回程站已经实际核对

### 1. 线路更替不是搜索摘要推断

[官方 2026 年 4 月服务调整说明](https://www.goldengate.org/golden-gate-transit-april-2026-service-changes/?Archive=y&Month=0&Year=0&pg=3)是可读取的官方 HTML：其 Route 120 项目明确记录 130、150 被 120 替代，并描述经 Sausalito 到 San Francisco 的走向。该历史调整说明可解释旧资料为何不适用，但不单独证明今天的具体班次。

[当前公交时刻索引](https://www.goldengate.org/bus/schedules-maps/)列出 **120 Strawberry–San Francisco**，标注生效日 **2026-09-13**。随后从这个现行索引打开实际线路页面，未采用旧 130／150 PDF 或非官方时刻表。

### 2. 真实线路查询结果

页面：[Route 120 当前官方时刻与方向查询](https://www.goldengate.org/bus/route-schedule/strawberry-san-francisco-120/?backurl=%2Fbus%2Fschedules-maps%2F)。

| 查询选择 | 实际页面结果 | 可以使用的结论 |
| --- | --- | --- |
| Southbound；Monday–Friday Except Holidays；Timepoint stops | Strawberry → San Francisco；timepoint 列包括 Bridgeway & El Portal | 这是回 San Francisco 方向的已核对候选站名 |
| Southbound；Saturday/Sunday/Holiday；Timepoint stops / All stops | 同样列出 Bridgeway & El Portal | 该候选并非仅来自工作日视图 |
| Northbound；Monday–Friday Except Holidays；Timepoint stops | San Francisco → Strawberry；timepoint 列包括 Bridgeway & Bay St | 去回程站名不同，不能只写“回原站上车” |

另实际切换了 Southbound 的 All stops：列表包括 Bridgeway 沿线各站、Bridgeway & El Portal、2nd/Main、Alexander 沿线及后续 San Francisco 站点。这里没有把 timepoint 当成线路仅有的停靠站。

该结果确认了线路、方向与官方候选站名，未确认读者从某家餐厅／码头走到站牌的最佳路径、道路哪一侧的现场标识、设备可用性或临时改站。撰稿时仍应要求旅客在官方当前线路图与站牌上确认方向，按当天通知复核。

公交 Alerts 同时显示 Manzanita 洪水条件提示和刷卡上下车提示。本次没有据条件性洪水提示推断全线正在停运，也没有把未发生的绕行写成旅行安排。

## 渡轮：码头、日期类别与临时表必须分开

页面：[Sausalito–San Francisco 官方查询](https://www.goldengate.org/ferry/route-schedule/sausalito-san-francisco/)。实际等待 JavaScript 加载后，页面不再是静态读取器看到的空壳。

### 1. 实际码头与方向

路线页面的城市／码头列表显示 **Sausalito Ferry Landing** 与 **San Francisco Ferry Building**。表格把“从 Sausalito 出发”和“从 San Francisco 出发”分列，而不是把码头名当作行驶方向。未来文章可明确这是 Golden Gate Ferry 的这条线路，不能据此把其他运营商的票或不同旧金山码头混入同一选择。

上述码头身份没有确认具体当班登船门、从公交站到码头的步行分钟数、排队容量或入口无障碍。常规表中不同航班还出现不同 SF gate，不能为整条线路写一个永久登船门。

### 2. “日期选择”实际上是服务类别选择

真实操作过该页两个选项：**MONDAY-FRIDAY** 和 **SATURDAY/SUNDAY/HOLIDAY**。页面标注常规表生效日 **2026-04-13**，没有发现可输入任意年月日的控件；也没有凭空构造一个日期查询接口。

[官方 Holiday Calendar](https://www.goldengate.org/ferry/riding-the-ferry/general-information/holiday-calendar/?backurl=/ferry/schedules-maps/)是可读 HTML，并分别给出 Ferry、Transit 的假日安排。假日并不一律代表两者都运行周末表：表内也有渡轮无服务或按工作日运行的情况。因此应按**具体旅行日期 → Ferry 栏／Transit 栏 → 对应日型 → 路线临时通知**核对，不能只凭星期几或“假日”一词选表。

### 3. 本次确实发现当期临时安排

切回工作日后，页面正文出现机械问题的临时 weekday schedule 提示，适用期限表述为直到另行通知；其后同时保留常规表。Alerts 页签的标题显示 **10/19–10/23 GGFERRY WEEKDAY SERVICE DISRUPTIONS ON ALL ROUTES**。

临时链接实际指向[官方 October 2026 temporary weekday PDF](https://www.goldengate.org/assets/1/6/GGFerry_TEMPORARY_WEekday_Oct_2026.pdf)。文件名为本次通知提供了年份上下文；本次没有将 PDF 文本灌入来源监测器，也没有从文件名推导通知一定延续到未来某个日期。Web 读取工具未能打开此 PDF，本核查依赖实际渲染的线路正文、Alerts 和可见链接确认临时表存在。

周末视图实际显示了不同表格，工作日机械问题横幅不在该视图正文中，但仍保留 Alerts 入口。不能因横幅不显示，就承诺未来周末不会发生变化。

本次不记录精确发船时刻或“最后可行返程”。后续攻略应教读者优先使用适用于旅行日期的现行通知，而不是复制当前常规表或将临时表永久固化进正文。

## 对自动核验与主题状态的建议

现有 `fetchOfficialText()` 仅接受 HTML / text，且移除脚本后做标准化；浏览器内实际渲染的线路数据与页面外部 PDF 不在它的确定性核验范围。**页面壳哈希没变，不等于站点、日期类别、班次或临时安排没变。**

- 可考虑先登记可读的服务调整 HTML，支持“130／150 已被 120 取代”这一有出处的事实，仍设有效期并保留现行索引复核。
- 若登记 Bridgeway & El Portal、Southbound 或渡轮渲染界面的人工核验事实，应明确不自动续期；不要给它填入来自浏览器 DOM 或 PDF、但静态抓取器实际拿不到的 `evidence` 字符串。
- 现有监测器对没有 `evidence` 的事实不会自动续期，但这项实现细节需根代理审核确认后再作为登记方案使用。本次没有调整监测代码、事实字段或过期规则。
- 具体班次、登船门、临时机械安排和最后返程继续要求旅行前人工查看官方页面，不用本次研究取代未来日期检查。
- 本文提交的是研究证据；在新事实登记方式与来源健康报告对齐前，不自行把选题改为 ready，也不创作／批准该篇文章。

## 本地证据

以下文件为 ignored 本地证据，不是来源注册中的机器哈希或人工审批记录：

- `artifacts/sausalito-rendered-source-review.json`：核验时间、实际 URL、两方向站名、真实操作过的服务类别和未核实边界。
- `artifacts/sausalito-route120-southbound.png`：回 SF 的方向与候选站。
- `artifacts/sausalito-route120-northbound.png`：相反方向的不同候选站。
- `artifacts/sausalito-ferry-weekday-temporary.png`：工作日临时表横幅与内容。
- `artifacts/sausalito-ferry-weekend-view.png`：实际周末类别视图及码头列表。

所有研究标签均由本任务新建，没有操作 GA、Search Console 或账户配置；没有发布、购买、填写个人资料或请求新的账号授权。
