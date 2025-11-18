#!/bin/bash

# 确保当前路径以 monsterai 结尾
current_dir=${PWD##*/}
if [ "$current_dir" != "monsterai" ]; then
  echo "❌ 当前路径不是 monsterai 目录，请在 monsterai 目录下运行此脚本。"
  exit 1
fi

echo "开始执行脚本..."
echo "--------------------------------"
echo "安装依赖"
npm install 
echo "进入ios目录"
cd ios 
echo "安装pod"
pod install 
echo "返回上一级工程目录"
cd .. 
echo "--------------------------------"