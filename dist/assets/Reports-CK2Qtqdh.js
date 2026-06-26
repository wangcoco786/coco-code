import{a as e,n as t,t as n}from"./jsx-runtime-D57Vegw5.js";import{n as r,r as i}from"./useProjectIssues-DL7E1UTn.js";import{t as a}from"./riskEngine-CdziR63t.js";import{n as o,t as s}from"./useWecomSend-ByF3lVYn.js";import{n as c}from"./AppContext-vuiWzryR.js";import{n as l}from"./I18nContext-D9TJNbnI.js";import{t as u}from"./useSprintHistory-BocDmYdf.js";import{t as d}from"./AIInsight-B6IySa9C.js";var f=e(t(),1),p={page:`_page_hdmyj_1`,header:`_header_hdmyj_3`,headerLeft:`_headerLeft_hdmyj_12`,title:`_title_hdmyj_13`,subtitle:`_subtitle_hdmyj_14`,quickCards:`_quickCards_hdmyj_17`,quickCard:`_quickCard_hdmyj_17`,quickCardIcon:`_quickCardIcon_hdmyj_36`,quickCardLabel:`_quickCardLabel_hdmyj_37`,quickCardDesc:`_quickCardDesc_hdmyj_38`,layout:`_layout_hdmyj_41`,card:`_card_hdmyj_49`,cardTitle:`_cardTitle_hdmyj_56`,table:`_table_hdmyj_63`,selected:`_selected_hdmyj_83`,statusBadge:`_statusBadge_hdmyj_85`,statusDraft:`_statusDraft_hdmyj_91`,statusPushed:`_statusPushed_hdmyj_92`,btnLink:`_btnLink_hdmyj_94`,btnPush:`_btnPush_hdmyj_105`,preview:`_preview_hdmyj_119`,previewTitle:`_previewTitle_hdmyj_128`,previewContent:`_previewContent_hdmyj_138`,previewPre:`_previewPre_hdmyj_144`,previewEmpty:`_previewEmpty_hdmyj_154`,loading:`_loading_hdmyj_162`,errorBanner:`_errorBanner_hdmyj_171`,filterBar:`_filterBar_hdmyj_191`,filterSelect:`_filterSelect_hdmyj_199`,filterReset:`_filterReset_hdmyj_212`},m=n(),h=[{type:`daily`,labelKey:`reports.daily`,descKey:`reports.dailyDesc`,icon:`📅`},{type:`weekly`,labelKey:`reports.weekly`,descKey:`reports.weeklyDesc`,icon:`📊`},{type:`sprint_review`,labelKey:`reports.sprint`,descKey:`reports.sprintDesc`,icon:`🎯`},{type:`daily`,labelKey:`reports.monthly`,descKey:`reports.monthlyDesc`,icon:`📈`},{type:`weekly`,labelKey:`reports.collaboration`,descKey:`reports.collaborationDesc`,icon:`🤝`}];function g(e,t,n,r){let i=n.length,a=n.filter(e=>e.status===`done`).length,o=n.filter(e=>e.status===`in_progress`).length,s=n.filter(e=>e.status===`in_review`).length,c=n.filter(e=>e.status===`in_testing`).length,l=n.filter(e=>e.status===`todo`).length,u=i>0?Math.round(a/i*100):0,d=r.filter(e=>e.level===`high`),f=r.filter(e=>e.level===`medium`),p=n.filter(e=>e.priority===`P0`&&e.status!==`done`),m=n.filter(e=>e.priority===`P1`&&e.status!==`done`),h=n.filter(e=>!e.assignee&&e.status!==`done`),g=new Map;for(let e of n){let t=e.assignee?.name??`未分配`,n=g.get(t)??{name:t,total:0,done:0,inProgress:0};n.total++,e.status===`done`&&n.done++,e.status===`in_progress`&&n.inProgress++,g.set(t,n)}let _=Array.from(g.values()).sort((e,t)=>t.total-e.total),v=n.filter(e=>e.status===`done`).sort((e,t)=>new Date(t.updatedAt).getTime()-new Date(e.updatedAt).getTime()).slice(0,5),y=n.filter(e=>e.status===`in_progress`).sort((e,t)=>{let n={P0:0,P1:1,P2:2,P3:3};return(n[e.priority]??9)-(n[t.priority]??9)}).slice(0,8),b=new Date().toLocaleDateString(`zh-CN`),x=_.slice(0,10).map(e=>{let t=e.total>0?Math.round(e.done/e.total*100):0;return`| ${e.name} | ${e.total} | ${e.done} | ${e.inProgress} | ${t}% |`}).join(`
`),S=d.length>0?d.map(e=>`- 🔴 ${e.description}${e.assignee?`（${e.assignee}）`:``}`).join(`
`):`- 暂无高危风险`,C=f.length>0?f.slice(0,5).map(e=>`- 🟡 ${e.description}${e.assignee?`（${e.assignee}）`:``}`).join(`
`):`- 暂无中危风险`;if(e===`daily`)return`# 日报 - ${b}
**${t}**

## 📊 Sprint 进度
- 总任务：${i} 个
- ✅ 已完成：${a}（${u}%）
- 🔄 进行中：${o} | 📋 待办：${l} | 🔍 评审：${s} | 🧪 测试：${c}

## 🔥 进行中的任务
${y.length>0?y.map(e=>`- [${e.priority}] ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`):`- 暂无进行中任务`}

## ✅ 最近完成
${v.length>0?v.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`—`}）`).join(`
`):`- 暂无`}

## ⚠️ 风险提醒
${S}
${p.length>0?`\n**P0 紧急未完成（${p.length}个）：**\n${p.map(e=>`- ${e.id} ${e.title}`).join(`
`)}`:``}
${h.length>0?`\n**未分配任务：${h.length} 个**`:``}

---
*本报告由 AI-PM 平台自动生成 · ${b}*`;if(e===`weekly`)return`# 周报 - ${t}
**报告日期：${b}**

## 📊 Sprint 整体进度
| 指标 | 数值 |
|------|------|
| 总任务 | ${i} |
| 已完成 | ${a}（${u}%）|
| 进行中 | ${o} |
| 评审中 | ${s} |
| 测试中 | ${c} |
| 待办 | ${l} |

## 👥 团队成员工作量
| 成员 | 总任务 | 已完成 | 进行中 | 完成率 |
|------|--------|--------|--------|--------|
${x}

## ✅ 本周完成的任务
${v.length>0?v.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`—`}）`).join(`
`):`- 暂无完成任务`}

## 🔄 当前进行中
${y.length>0?y.map(e=>`- [${e.priority}] ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`):`- 暂无`}

## ⚠️ 风险与阻塞
**高危风险（${d.length}个）：**
${S}

**中危风险（${f.length}个）：**
${C}

${p.length>0?`**P0 紧急未完成（${p.length}个）：**\n${p.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`)}`:``}
${m.length>0?`\n**P1 高优未完成（${m.length}个）：**\n${m.slice(0,5).map(e=>`- ${e.id} ${e.title}`).join(`
`)}`:``}
${h.length>0?`\n**⚠️ 未分配任务：${h.length} 个，需尽快分配**`:``}

## 📋 下周计划
- 继续推进 Sprint 剩余 ${i-a} 个任务
- 重点关注 ${p.length} 个 P0 任务和 ${d.length} 个高危风险
${h.length>0?`- 分配 ${h.length} 个未分配任务`:``}

---
*本报告由 AI-PM 平台自动生成 · ${b}*`;if(e===`sprint_review`){let e=_.filter(e=>e.name!==`未分配`).slice(0,5),n=e.filter(e=>e.total>15),r=e.filter(e=>e.total<5);return`# Sprint 复盘报告 - ${t}
**报告日期：${b}**

## 📊 Sprint 概览
| 指标 | 数值 |
|------|------|
| 计划任务 | ${i} |
| 完成任务 | ${a} |
| 完成率 | ${u}% |
| 未完成 | ${i-a} |
| 高危风险 | ${d.length} |
| 中危风险 | ${f.length} |

## 👥 团队贡献
| 成员 | 总任务 | 已完成 | 进行中 | 完成率 |
|------|--------|--------|--------|--------|
${x}

${n.length>0?`**⚠️ 负载过高：** ${n.map(e=>e.name).join(`、`)}（任务数 > 15）`:``}
${r.length>0?`**💡 可承担更多：** ${r.map(e=>e.name).join(`、`)}（任务数 < 5）`:``}

## ⚠️ 风险回顾
**高危风险（${d.length}个）：**
${S}

**中危风险（${f.length}个）：**
${C}

## 📌 未完成任务分析
${p.length>0?`**P0 紧急（${p.length}个）：**\n${p.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`)}`:`- 无 P0 遗留`}
${m.length>0?`\n**P1 高优（${m.length}个）：**\n${m.slice(0,8).map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`)}`:``}

## 💡 改进建议
1. ${u<70?`完成率偏低，建议优化需求拆分和估算`:`完成率良好，继续保持`}
2. ${d.length>3?`高危风险较多，建议加强风险预警和提前干预`:`风险可控`}
3. ${h.length>5?`${h.length} 个任务未分配，建议优化任务分配流程`:`任务分配合理`}
4. ${n.length>0?`部分成员负载过高，建议平衡工作量`:`团队负载均衡`}

---
*本报告由 AI-PM 平台自动生成 · ${b}*`}return`报告内容生成中…`}function _(){let{currentUser:e,currentProjectKey:t}=c(),{t:n}=l(),[_,y]=(0,f.useState)(null),[b,x]=(0,f.useState)({}),[S,C]=(0,f.useState)(``),[w,T]=(0,f.useState)(``),[E,D]=(0,f.useState)(``),{sprints:O}=u(t,10),{data:k=[]}=i(t),A=k[0]??null,j=E?E.split(`|`).filter(Boolean):[],M=j.length>0?j[0]:A?.name||null,{data:N=[],isLoading:P,isError:F,error:I}=r(t,j.length>0?O.find(e=>e.name===j[0])?.id??null:A?.id??null,M),L=P&&!!t,R=s(),z=e?.role===`DEV`,B=M??t??`Project`,V=(0,f.useMemo)(()=>a(N),[N]),H=V.filter(e=>e.level===`high`).length,U=V.filter(e=>e.level===`medium`).length,W=N.filter(e=>e.status===`done`).length,G=(0,f.useMemo)(()=>{let e=new Date().toISOString().slice(0,10),t=[{id:`report-daily-1`,type:`daily`,title:`${B} 日报`,date:e,status:b[`report-daily-1`]??`draft`,content:g(`daily`,B,N,V)},{id:`report-weekly-1`,type:`weekly`,title:`${B} 周报`,date:e,status:b[`report-weekly-1`]??`draft`,content:g(`weekly`,B,N,V)},{id:`report-sprint-1`,type:`sprint_review`,title:`${B} 复盘报告`,date:e,status:b[`report-sprint-1`]??`draft`,content:g(`sprint_review`,B,N,V)}];return z?t.filter(e=>e.type===`daily`):t},[B,N,W,H,U,b,z]),K=G.find(e=>e.id===_)??null,q=(0,f.useMemo)(()=>G.filter(e=>!(S&&e.type!==S||w&&e.status!==w)),[G,S,w]),J=S!==``||w!==``||E!==``;function Y(){C(``),T(``),D(``)}function X(e){R.mutate(o(e),{onSuccess:()=>{x(t=>({...t,[e.id]:`pushed`}))}})}return(0,m.jsxs)(`div`,{className:p.page,children:[(0,m.jsx)(`div`,{className:p.header,children:(0,m.jsxs)(`div`,{className:p.headerLeft,children:[(0,m.jsx)(`h1`,{className:p.title,children:n(`reports.title`)}),(0,m.jsx)(`div`,{className:p.subtitle,children:n(`reports.subtitle`)})]})}),F&&(0,m.jsxs)(`div`,{className:p.errorBanner,children:[`⚠️ `,n(`dashboard.errorLoad`),`：`,I instanceof Error?I.message:n(`common.error`)]}),t&&N.length>0&&(0,m.jsx)(d,{title:n(`ai.insight`),buildPrompt:()=>{let e=N.filter(e=>e.status===`done`).length,n=N.filter(e=>e.status===`in_progress`).length;return`请基于以下数据生成一段简洁的项目进展摘要，可用于日报/周报：\n- 项目: ${t}\n- Sprint: ${A?.name??`无`}\n- 总任务: ${N.length}，已完成: ${e}，进行中: ${n}\n- 完成率: ${N.length>0?Math.round(e/N.length*100):0}%\n请用中文回答，给出：1. 本期进展摘要 2. 关键成果 3. 待解决问题`}}),(0,m.jsx)(`div`,{className:p.quickCards,children:h.map(e=>(0,m.jsxs)(`div`,{className:p.quickCard,children:[(0,m.jsx)(`div`,{className:p.quickCardIcon,children:e.icon}),(0,m.jsx)(`div`,{className:p.quickCardLabel,children:n(e.labelKey)}),(0,m.jsx)(`div`,{className:p.quickCardDesc,children:n(e.descKey)})]},e.labelKey))}),L?(0,m.jsx)(`div`,{className:p.loading,children:n(`common.loading`)}):(0,m.jsxs)(`div`,{className:p.layout,children:[(0,m.jsxs)(`div`,{className:p.card,children:[(0,m.jsx)(`div`,{className:p.cardTitle,children:n(`reports.reportList`)}),(0,m.jsxs)(`div`,{className:p.filterBar,style:{padding:`12px 16px 0`},children:[(0,m.jsx)(v,{sprints:O,selected:E,onSelect:D}),(0,m.jsxs)(`select`,{className:p.filterSelect,value:S,onChange:e=>C(e.target.value),children:[(0,m.jsx)(`option`,{value:``,children:n(`reports.allTypes`)}),(0,m.jsx)(`option`,{value:`daily`,children:n(`reports.daily`)}),(0,m.jsx)(`option`,{value:`weekly`,children:n(`reports.weekly`)}),(0,m.jsx)(`option`,{value:`sprint_review`,children:n(`reports.sprint`)})]}),(0,m.jsxs)(`select`,{className:p.filterSelect,value:w,onChange:e=>T(e.target.value),children:[(0,m.jsx)(`option`,{value:``,children:n(`reports.allStatus`)}),(0,m.jsx)(`option`,{value:`draft`,children:n(`reports.draft`)}),(0,m.jsx)(`option`,{value:`pushed`,children:n(`reports.pushed`)})]}),J&&(0,m.jsx)(`button`,{className:p.filterReset,onClick:Y,children:n(`common.reset`)})]}),(0,m.jsxs)(`table`,{className:p.table,children:[(0,m.jsx)(`thead`,{children:(0,m.jsxs)(`tr`,{children:[(0,m.jsx)(`th`,{children:n(`reports.type`)}),(0,m.jsx)(`th`,{children:n(`reports.reportTitle`)}),(0,m.jsx)(`th`,{children:n(`reports.date`)}),(0,m.jsx)(`th`,{children:n(`reports.status`)}),(0,m.jsx)(`th`,{children:n(`reports.actions`)})]})}),(0,m.jsx)(`tbody`,{children:q.map(e=>{let t={daily:n(`reports.daily`),weekly:n(`reports.weekly`),sprint_review:n(`reports.sprint`)};return(0,m.jsxs)(`tr`,{className:_===e.id?p.selected:``,children:[(0,m.jsx)(`td`,{children:t[e.type]}),(0,m.jsx)(`td`,{children:e.title}),(0,m.jsx)(`td`,{children:e.date}),(0,m.jsx)(`td`,{children:(0,m.jsx)(`span`,{className:`${p.statusBadge} ${e.status===`pushed`?p.statusPushed:p.statusDraft}`,children:e.status===`pushed`?n(`reports.pushed`):n(`reports.draft`)})}),(0,m.jsxs)(`td`,{children:[(0,m.jsx)(`button`,{className:p.btnLink,onClick:()=>y(e.id),children:n(`common.view`)}),(0,m.jsx)(`button`,{className:p.btnPush,onClick:()=>X(e),disabled:R.isPending||e.status===`pushed`,children:R.isPending?n(`reports.pushing`):n(`reports.pushWecom`)})]})]},e.id)})})]})]}),(0,m.jsxs)(`div`,{className:p.preview,children:[(0,m.jsxs)(`div`,{className:p.previewTitle,children:[n(`reports.preview`),K&&(0,m.jsx)(`span`,{style:{fontSize:12,color:`var(--text2)`,fontWeight:400},children:K.title})]}),(0,m.jsx)(`div`,{className:p.previewContent,children:K?(0,m.jsx)(`pre`,{className:p.previewPre,children:K.content}):(0,m.jsx)(`div`,{className:p.previewEmpty,children:n(`reports.previewEmpty`)})})]})]})]})}function v({sprints:e,selected:t,onSelect:n}){let[r,i]=(0,f.useState)(!1),[a,o]=(0,f.useState)(``),s=(0,f.useRef)(null),c=t?t.split(`|`).filter(Boolean):[],l=e.filter(e=>e.name.toLowerCase().includes(a.toLowerCase())||(e.startDate??``).includes(a));(0,f.useEffect)(()=>{function e(e){s.current&&!s.current.contains(e.target)&&i(!1)}return r&&document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[r]);function u(e){let t=new Set(c);t.has(e)?t.delete(e):t.add(e),n(t.size>0?Array.from(t).join(`|`):``)}function d(){n(l.map(e=>e.name).join(`|`))}function h(){n(``)}if(e.length===0)return null;let g=c.length===0?`当前 Sprint`:c.length<=2?c.join(`, `):`已选 ${c.length} 个`;return(0,m.jsxs)(`div`,{ref:s,style:{position:`relative`,display:`inline-block`},children:[(0,m.jsxs)(`div`,{className:p.filterSelect,onClick:()=>i(!r),style:{cursor:`pointer`,userSelect:`none`,minWidth:200,display:`inline-flex`,alignItems:`center`,gap:4},children:[(0,m.jsx)(`span`,{style:{flex:1,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:g}),(0,m.jsx)(`span`,{style:{opacity:.5,fontSize:10},children:r?`▲`:`▼`})]}),r&&(0,m.jsxs)(`div`,{style:{position:`absolute`,top:`100%`,left:0,zIndex:1e3,background:`var(--card, #fff)`,border:`1px solid var(--border, #e0e0e0)`,borderRadius:8,boxShadow:`0 8px 24px rgba(0,0,0,0.12)`,width:320,marginTop:4},children:[(0,m.jsx)(`div`,{style:{padding:`8px 12px`,borderBottom:`1px solid var(--border, #eee)`},children:(0,m.jsx)(`input`,{type:`text`,placeholder:`搜索 Sprint...`,value:a,onChange:e=>o(e.target.value),autoFocus:!0,style:{width:`100%`,padding:`6px 10px`,border:`1px solid var(--border, #ddd)`,borderRadius:4,fontSize:13,outline:`none`}})}),(0,m.jsxs)(`div`,{style:{padding:`4px 12px`,display:`flex`,gap:8,borderBottom:`1px solid var(--border, #eee)`},children:[(0,m.jsx)(`button`,{onClick:d,style:{fontSize:12,color:`var(--primary, #1677ff)`,background:`none`,border:`none`,cursor:`pointer`,padding:`4px 0`},children:`全选`}),(0,m.jsx)(`button`,{onClick:h,style:{fontSize:12,color:`var(--text2, #999)`,background:`none`,border:`none`,cursor:`pointer`,padding:`4px 0`},children:`清空`})]}),(0,m.jsxs)(`div`,{style:{maxHeight:240,overflowY:`auto`,padding:`4px 0`},children:[l.map(e=>(0,m.jsxs)(`label`,{style:{display:`flex`,alignItems:`center`,gap:8,padding:`6px 12px`,cursor:`pointer`,fontSize:13,transition:`background 0.1s`},onMouseEnter:e=>e.currentTarget.style.background=`#f0f5ff`,onMouseLeave:e=>e.currentTarget.style.background=`transparent`,children:[(0,m.jsx)(`input`,{type:`checkbox`,checked:c.includes(e.name),onChange:()=>u(e.name),style:{margin:0}}),(0,m.jsx)(`span`,{style:{flex:1,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:e.name}),(0,m.jsxs)(`span`,{style:{fontSize:11,color:`var(--text2, #999)`,flexShrink:0},children:[e.state===`active`?`🟢`:`⚪`,` `,e.startDate??``]})]},e.id)),l.length===0&&(0,m.jsx)(`div`,{style:{padding:12,textAlign:`center`,color:`var(--text2)`,fontSize:13},children:`无匹配结果`})]})]})]})}export{_ as default};