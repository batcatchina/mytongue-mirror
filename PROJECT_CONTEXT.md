# 舌镜 (Tongue Mirror) - 项目上下文

> 本文件供 Codex/炼器 agent 学习项目全貌，每次开工前先读此文件。

## 项目概述
- **名称**: tongue-mirror-frontend (舌诊辅助系统)
- **版本**: 1.3.0
- **域名**: she-zhen.top / www.she-zhen.top
- **技术栈**: React 18 + TypeScript + Vite 5 + Zustand + TailwindCSS
- **部署**: Vercel (项目ID: prj_T0r3ZMgUz5v7vVJmb2KIJD1DmZCe)
- **仓库**: https://github.com/batcatchina/mytongue-mirror.git

## 架构设计
```
src/
├── ai/                    # AI舌象分析
│   ├── FeatureExtractor.ts    # 特征提取
│   ├── TongueAnalyzer.ts      # 舌象分析主逻辑
│   └── ZoneSegmenter.ts       # 舌部分区
├── engine/                # 四层推理引擎（核心）
│   ├── core/                  # 推理引擎核心
│   │   ├── InferenceChain.ts      # 推理链
│   │   ├── InferenceNode.ts       # 推理节点
│   │   ├── LayerProcessor.ts      # 层处理器基类
│   │   └── TransmissionEngine.ts  # 传变引擎
│   ├── layers/                 # 四层处理器
│   │   ├── Layer1Processor.ts     # L1: 舌质舌苔→基础特征
│   │   ├── Layer2Processor.ts     # L2: 舌形舌态→形态特征
│   │   ├── Layer3Processor.ts     # L3: 证型推理
│   │   └── Layer4Processor.ts     # L4: 传变分析
│   └── rules/                  # 辨证规则
│       ├── tongueBody.rules.ts    # 舌体规则
│       ├── tongueShape.rules.ts   # 舌形规则
│       ├── transmission.rules.ts  # 传变规则
│       └── zone.rules.ts          # 分区规则
├── pages/
│   └── Diagnosis/
│       └── DiagnosisPage.tsx   # ⚠️ 主页面（1592行，最核心也最复杂）
├── services/
│   ├── diagnosisEngine.ts     # 本地规则引擎（v1.0，基于主人临床规则树v2.0）
│   ├── diagnosisRules.ts      # 辨证规则定义
│   ├── tongueAI.ts            # 舌象AI服务
│   ├── api.ts                 # 后端API调用
│   ├── acupoint_data.ts       # 穴位数据
│   ├── constitutionAssessment.ts  # 体质评估
│   └── interrogation/         # 问诊引擎
│       ├── InterrogationEngine.ts  # 问诊主逻辑
│       ├── TenQuestions.ts         # 十问歌
│       ├── QuestionTree.ts         # 问题树
│       ├── AgeWeightCalculator.ts  # 年龄权重
│       └── CorrectionRules.ts      # 校正规则
├── stores/
│   └── diagnosisStore.ts      # Zustand状态管理
├── types/
│   ├── index.ts               # 类型汇总导出
│   ├── inference.ts           # 推理类型
│   ├── input.ts               # 输入类型
│   ├── output.ts              # 输出类型（DiagnosisResult, AcupuncturePlan等）
│   ├── tongue.ts              # 舌象类型
│   └── interrogation.ts      # 问诊类型
├── components/                # UI组件
├── hooks/                     # 自定义hooks
├── utils/                     # 工具函数
└── styles/                    # 样式
```

## 核心数据流
```
用户拍照 → AI识别(tongueAI) → 特征提取(FeatureExtractor)
  → 四层推理引擎(TransmissionEngine)
    → L1: 舌质舌苔基础特征
    → L2: 舌形舌态形态特征
    → L3: 证型推理（输出primarySyndrome）
    → L4: 传变分析（脏腑传变路径）
  → 本地规则引擎(diagnosisEngine) → 针灸方案+养生建议
  → [可选] 智能问诊(interrogation) → 问诊后整合
  → 最终结果展示
```

## 关键类型定义
- **DiagnosisResult**: primarySyndrome, syndromeScore, confidence, secondarySyndromes, pathogenesis, organLocation, diagnosisEvidence, priority('高'|'中'|'低')
- **AcupuncturePlan**: treatmentPrinciple, mainPoints, secondaryPoints, contraindications, treatmentAdvice
- **AcupuncturePoint**: point, meridian, effect, location, technique, precautions
- **LifeCareAdvice**: dietSuggestions, dailyRoutine, precautions (注意：不是diet/lifestyle/mood)
- **DiagnosisStep**: 'idle' | 'uploading' | 'recognizing' | 'analyzing' | 'reasoning' | 'matching' | 'result'

## 已修复的Bug（2026-05-16）
1. ✅ **主穴丢失**: 问诊后整合时，优先使用原辨证的针灸方案，fallback到preliminaryResult
2. ✅ **凹凸回填**: 从shape_distribution提取凹陷/鼓胀，而非tongue_shape.depression/bulge旧格式
3. ✅ **lifeCareAdvice字段映射**: 正确字段是dietSuggestions/dailyRoutine/precautions
4. ✅ **TypeScript类型修复**: priority用'as const'，复杂对象用'as any'兼容
5. ✅ **DiagnosisStep缺少'result'**: 已添加到类型定义

## 已知问题
- DiagnosisPage.tsx 1592行，过于庞大，需要拆分重构
- SocialProofBanner和diagnoseWithDeepSeek声明但未使用（TS6133警告）
- 缓存机制用localStorage，key=tcm_diag_cache_v2，MAX_CACHE=50
- 问诊流程中的一些边界case还需要打磨

## 开发注意
- **构建**: `npm run build` (会清除vite缓存)
- **预览**: `npm run preview` (默认4173端口)
- **类型检查**: `npx tsc --noEmit`
- **Vercel部署**: `vercel deploy --prod --token <token>`
- **Git推送不会自动部署**，需手动CLI部署或面板Redeploy
- **免费版每日100次部署上限**，不要频繁push
- **修改前先确认线上版本**，避免版本混乱

## 编码风格
- 中文注释为主（面向中医领域）
- 组件内状态管理用useState，全局用Zustand
- API调用统一走services/api.ts
- 辨证规则100%忠实于主人临床规则，不含AI自由发挥
- 所有生成类任务调DeepSeek（70倍成本差距），复杂推理自己来
