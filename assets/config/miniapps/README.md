
## 测试环境
## 更新MiniApp列表
aws s3 cp ./assets/config/miniapps/miniapp_list_config_debug.json s3://vsa-bucket-public-new/monster/

## 正式环境
## 更新MiniApp列表(谨慎操作!)
aws s3 cp ./assets/config/miniapps/miniapp_list_config_prod.json s3://vsa-bucket-public-new/monster/


## 验证方式
https://dzdbhsix5ppsc.cloudfront.net/monster/miniapp_list_config_debug.json
https://dzdbhsix5ppsc.cloudfront.net/monster/miniapp_list_config_prod.json