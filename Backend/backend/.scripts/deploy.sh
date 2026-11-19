set -e 
echo "deploy start"

#pull the last version 
git pull origin main
echo "new changes copie to server " 
#activate env 
source mb/bin/activate
echo "we activate env "
#install dependencies
echo "insatll dependencies"
pip install -r requirements.txt
echo "dependencies installed "


#collect static files
echo "collect static files"
python manage.py collectstatic --noinput
echo "static files collected"

#migrate database
echo "migrate database"
python manage.py migrate
echo "database migrated"


echo "deactivate le env "
desactivate

pushd ltc
touch wsgi.py
popd
echo "Deploy finisded "










