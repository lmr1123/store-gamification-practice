# POS收银办卡顾客Agent配置说明

本文件由门店调研话术自动归纳生成，核心模型为：顾客回复 = 主意图 + 槽位限制 + 顾客状态。

## 生成的6类顾客Agent
- pos_member_value_sensitive_001：价值敏感型：觉得优惠小/没必要
- pos_member_risk_privacy_001：隐私风险型：怕手机号/企微/电话骚扰
- pos_member_time_pressure_001：时间紧张型：赶时间/怕麻烦
- pos_member_low_frequency_001：低频/路过型：不常来/不固定门店
- pos_member_process_doubt_001：流程疑虑型：不想扫码/验证码/加企微
- pos_member_strong_reject_001：强拒绝型：反感推销/重复拒绝

## 三类核心意图
- value：优惠/省钱/值不值
- time：办理时间/麻烦程度
- risk：隐私/骚扰/安全

## 导入建议
1. 将 JSON 放入 data/customer_agents.json 或等价配置目录。
2. 对话生成前先计算主意图，再套用 slot_constraints。
3. 评分报告展示 value/time/risk 三类顾虑是否被解决。
