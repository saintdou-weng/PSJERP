# VRT ERP（技術代號 PSJERP）

網址：https://saintdou-weng.github.io/vrt-asset/

這個 repo 只放 VRT ERP / PSJERP。舊的 vrt-asset 內容已全部移除。

| 檔案 | 用途 |
|---|---|
| `index.html` | VRT ERP 網頁（單一檔案，GitHub Pages 直接開） |
| `PSJERP.gs` | Google Apps Script v0.6.0（Token / Chat ID / 同步密碼留空，可放 GitHub；真正貼進 Apps Script 的是另一份已填好的） |
| `SETUP.md` | 安裝與更新步驟 |
| `DEPLOY_ONCE.md` | 部署重點摘要 |
| `CLAUDE_INSTRUCTIONS.md` | 主指令（V2 + V3 追加，最新 V3.6） |
| `.nojekyll` | 讓 GitHub Pages 原樣提供檔案 |

## v0.7.0 重點：再加 5 種 ERP 報表（2026-10-16）

| 報表 | 檔名 | 頁面 | 雲端資料集 |
|---|---|---|---|
| W_CODK75 製單資料綜合查詢 | `CODK75.txt` | 📋 製單 | PROD_ORDER |
| W_CPU320 採購進貨（驗收） | `N06.txt`（主料）、`N07–N10.txt`（副料） | 📥 進貨驗收 | RECEIVING |
| W_CBL140 INVOICE 查詢 | `N11–N14.txt` | 🧾 INVOICE | INVOICE |
| W_AR700 廠商結帳明細表 | `AR2014.XLS … AR2026.XLS`（一年一檔） | 💳 應付明細 | AP |
| W_ARA40 應付帳款彙總 | `N18.XLS` | 📒 應付彙總（時點值） | AP_SUM |

- W_AR700 的 Excel 只有第一頁印廠商，所以每一列的廠商用驗收單號（W_CPU320）或採購單號補上：**先匯入 N06–N10，再匯入 AR 檔**。
- Apps Script 要同步更新到 v0.7.0（`ERP_SHEETS` 多了 5 個資料集），否則雲端會回 BAD_SHEET。

## v0.6.0 重點：下載的 ERP 檔全部能直接丟進來

- **任何一頁都能拖檔**：把 `下載\ERP_export` 的檔案拖到畫面上就好，不用先選分頁；每個檔一列，一個都不會漏。
- **14 種 ERP 報表自動辨識**（標題或欄名）：W_COD700、W_COD690、W_COD550、W_CPU350、W_CPU340、W_CPU795、W_CST541、W_CST551、W_CST580、K01、K02、K04（W_CST302）、W_CBL300（S*.txt）、SMV。每個檔都和報表合計核對，核對失敗預設不匯入。
- **新頁面**：採購單價、主副料進耗存、成品庫存、人工彙總（月彙總，不放個人薪資）；側欄有「人事（HRA Portal）」外連。
- **期間導覽**：打開時停在最近有資料的期間；年份／月份下拉有資料的加 ●；沒資料的期間會提示並可一鍵跳到最近有資料的期間。
- **欄位對應範本**：不認得的檔第一次選資料集、存成範本，下次同樣欄位的檔自動套用（範本存在雲端）。
- **匯出 Excel**：目前期間＋篩選；第 1 頁「說明」（期間、篩選、來源檔、合計），第 2 頁「資料」。
- **資料覆蓋表**（智慧匯入、同步中心）：2014–2026 每年每種報表上傳了沒有。
- **雲端拆檔**：每種資料一個試算表、每個匯入批次一個分頁，不會超過 Google 1,000 萬格上限。

## v0.5.1 重點：雲端同步（手機 / 電腦看同一份資料）

- 電腦匯入 ERP 檔 → 自動上傳到 Google 試算表 `PSJERP_ERPDATA`。
- 手機、其他電腦打開網頁 → 自動下載最新資料。
- 每台裝置第一次要輸入「同步密碼」一次（設定 → 雲端同步）。
- 右上角雲朵：☁️ 已同步 / 同步中 / 錯誤；點它到設定頁。
- 備註、標籤也會同步（ERP 正式數字鎖定，只有備註 / 標籤可改）。
- 同一份 ERP 檔重匯 = 取代，不會重複。

## v0.5 重點

- 只顯示真實 ERP 資料。
- 智慧匯入可一次拖多個 ERP 檔，自動辨識、與報表合計核對後才寫入。
- 選「月 / 年」時是月報 / 年報列表（同 VRT Sewing 月年趨勢），點列才看明細。

## 規則

- Legacy ERP（clothes.exe / SQL）永遠唯讀。
- Bot Token、Chat ID、同步密碼只放在 Apps Script，不放 GitHub、不放網頁。
- 每個模組都能單獨開：`#orders`、`#bom`、`#finished-goods`…；前面加 `solo-` 會隱藏側欄。
