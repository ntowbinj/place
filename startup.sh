MY_PATH="`dirname \"$0\"`"
cd $MY_PATH
/usr/local/bin/gunicorn --reload -D --worker-connections 1000 -b 127.0.0.1:8090 wsgi --access-logfile /var/log/hearit-accesslog.log --log-file /var/log/hearit-app.log --error-logfile /var/log/hearit-error.log

