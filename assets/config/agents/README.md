
## 测试环境
## 更新AgentList列表
aws s3 cp ./assets/config/agents/agent_list_config_debug.json s3://vsa-bucket-public-new/monster/

## 正式环境
## 更新AgentList列表(谨慎操作!)
aws s3 cp ./assets/config/agents/agent_list_config_prod.json s3://vsa-bucket-public-new/monster/


## 验证方式
https://vsa-bucket-public-new.s3.us-east-1.amazonaws.com/monster/agent_list_config_debug.json
https://vsa-bucket-public-new.s3.us-east-1.amazonaws.com/monster/agent_list_config_prod.json