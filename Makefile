.PHONY: push
push:
	pnpm run build
	tar zvcf dist.tar.gz dist
	scp -P 18022 dist.tar.gz root@116.196.122.21:/data/dkroot/nginx/wwwroot/
	rm -rf dist.tar.gz dist
	ssh root@116.196.122.21 -p 18022 "cd /data/dkroot/nginx/wwwroot/ && tar zvxf dist.tar.gz && rm -rf travel.hawtech.cn dist.tar.gz && mv dist travel.hawtech.cn"
