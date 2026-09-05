# RabbitMQ 消息规范

## 投递语义

系统基线是 **至少一次投递**。生产者启用 publisher confirms；消费者成功完成幂等业务后手动 ACK。由于网络与确认丢失可能导致重复投递，消费者必须幂等。

## 消息信封

```json
{
  "messageId": "msg_xxx",
  "eventType": "order.created.v1",
  "occurredAt": "2026-08-30T00:00:00Z",
  "producer": "order-module",
  "traceId": "trace_xxx",
  "aggregateId": "order_xxx",
  "schemaVersion": 1,
  "payload": {}
}
```

## 生产者

- 关键业务使用 Transactional Outbox；独立发布器负责重试和状态推进。
- Exchange、routing key、durability、mandatory/return 与 confirm 策略必须声明。
- 事件代表已经发生的事实，禁止消费者依赖生产者私有数据库结构。

## 消费者

- 先以 `messageId + consumer` 执行幂等检查，再处理业务并记录结果，最后 ACK。
- 可恢复错误按指数退避重试；业务永久错误或超过上限进入死信队列。
- 禁止无限 requeue 热循环；毒消息必须可查询、可告警、可人工重放。
- 明确 prefetch、并发度、单消息超时和优雅停机；只有处理完成的消息才能 ACK。

## 兼容性

- 消息只新增可选字段属于兼容变化；删除、重命名、改变语义必须升级事件版本。
- 消费者必须容忍未知字段；生产者在迁移窗口内兼容旧消费者。
- 重放不得重复发送短信、扣款、发券等不可逆副作用。
