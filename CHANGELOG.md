# Changelog

## [1.4.0] - 2026-05-16

### Fixed
- 主穴/配穴不再显示"待确认"，自动从穴位数据库补全经脉信息
- 配穴缺失时根据证型自动推导补充（配穴安全网）
- PatientInfo.age类型改为number|null，根除"年龄-1岁"问题
- 远程引擎超时15秒后提供本地分析降级按钮

### Added
- DiagnosisProgress分阶段进度组件（采集→分析→推理→方案）
- 辨证等待时显示中医经典知识贴士轮播
- 本地引擎最小展示时间800ms，节奏感优化
- 结果区域staggered fade-in过渡动画

### Changed
- acupoint_data.ts默认值从"待确认"改为空字符串，贯通fallback链路
- acupointKnowledge从DiagnosisPage抽离到独立配置文件
- 版本号1.3.0→1.4.0，知识库3.0→3.1
