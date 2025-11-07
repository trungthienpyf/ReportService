import logging
from django.core.management.base import BaseCommand
from bs4 import BeautifulSoup
import pytz
from datetime import datetime, date, timedelta
import time as sleep_time
from django.db import transaction
# from app.models import Statistics, PercentageTable
from app.models import User, Customer, ShareHolder, ShareholderCustomer, CustomerData
from app.utils import  save_json_to_file, read_json_from_file, group_customers_by_machine
import os
import requests
from django.db import IntegrityError, transaction
import json
from operator import itemgetter
from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)

VIETNAM_TZ = pytz.timezone('Asia/Ho_Chi_Minh')
class Command(BaseCommand):
    help = 'Run the scheduled data crawl'


    def add_arguments(self, parser):
        parser.add_argument(
        '--no-loop',
        action='store_true',
        help='Run once without infinite loop',
    )
    def handle(self, *args, **options):

        logger.info("Starting crawler worker service")
        if options['no_loop']:
            self.run_crawl_job()
        else:
            self.run_worker()

    def get_vietname_timezone(self):
        return datetime.now(VIETNAM_TZ)
    

   


    def crawl_data(self, fromDate, toDate):
        url = os.getenv('URL_2')
        params = {
        'date_start': fromDate,
        'date_end': toDate
    }
    
        response = requests.get(url, params=params)
    
        if response.status_code == 200:
            data = group_customers_by_machine(response.json())  # or response.text
            # save_json_to_file(data)
            # return json.dump(data,fp = , indent=2, ensure_ascii=False)
            return data
        else:
            raise Exception(f"Request failed with status code: {response.status_code}")


    def insert_user_to_db(self, data):
        try:

            with transaction.atomic():
                created_users = []
                skipped_users = []


                existing_usernames = set(User.objects.values_list('username', flat =True))

                for i in range(len(data)):
                    username_machine = data[i]['username']

                    if not username_machine:
                        skipped_users.append({
                            'data': data[i],
                            'reason':'username is required'
                        })

                    if username_machine in existing_usernames:
                        skipped_users.append(
                            {
                                'username': data[i]['username'],
                                'id': data[i]['id']
                             }
                        )
                        continue

                    try:
                        user_create = User.objects.create_user(
                            username = username_machine,
                            password = os.getenv('DEFAULT_PASSWORD'),
                            role = 'MACHINE'
                        )
                        created_users.append({
                            'id':user_create.id,
                            'username': user_create.username
                        })


                        existing_usernames.add(username_machine)

                    except Exception as e:
                        print(f"Error wheen insert User with Type is Machine to User database: {e}")
                all_users = User.objects.all().values('id', 'username', 'role')    
                users_list = [
                    {
                        "id": user['id'],
                        "username": user['username'],
                        "role": user['role'].lower(),  # Convert to lowercase as in your example
                    }
                        for user in all_users
                ] 
                return users_list   
        except Exception as e:
            print(f"Error with transition in insert_user_to_db function: {e}")


    def insert_customer_and_customerData_to_db(self, user_list, data, date_query): # đang sai ở đây, dữ liệu không thể lấy một vài từ customer table
        try:

            # today =  date(2025,10,20)
            today=date_query
            # with transaction.atomic():
            create_new_customer = []
            skipped_customers = []
            existing_customer_in_db = set(Customer.objects.values_list('name', flat =True))
            existing_user_in_db = set(User.objects.values_list('username', flat =True))

            for i in range(len(data)):
                # user = User.objects.get(username=user_list[i]['username'])
                user_machine_in_json = data[i]['username']
                if user_machine_in_json in existing_user_in_db:
                    user = User.objects.get(username = user_machine_in_json)
                    for j in range(len(data[i]["customersList"])):
                        customer, customer_created = Customer.objects.get_or_create(
                            name = data[i]["customersList"][j]['username'],
                            user=user,
                            defaults={}
                        )

                        customer_data = CustomerData.objects.create(
                            customers=customer,
                            laive=data[i]["customersList"][j]['lai_ve'],
                            thangthua=data[i]["customersList"][j]['thang_thua'],
                            tongcuoc=data[i]["customersList"][j]['tien_cuoc'],
                            date=today

                        )


        except Exception as e:
            print(f"Error with insert customer and CustomerData to Database: {e}")
        
        
    

    def insert_shareholder_to_db(self, data, date_query):
        # đi vào check type và username của parent, nếu parent đã có trong User table thì ko insert vào User table
        # ngược lại insert parent vào User table
        try:
            # today =  date(2025,10,20) 
            today = date_query
            # with transaction.atomic():
            for i in range(len(data)):
                user_db = User.objects.get(username= data[i]['username'])
                for j in range(len(data[i]['customersList'])):
                    customer = Customer.objects.get(name = data[i]['customersList'][j]['username'], user=user_db)
                    for k in range(len(data[i]['customersList'][j]["shareholders"])):
                        type = data[i]['customersList'][j]["shareholders"][k]["type"]
                        parent_name = data[i]['customersList'][j]["shareholders"][k]["parent_name"]
                        try:
                            user, created_user = User.objects.get_or_create(
                                username = parent_name
                            )
                            if created_user:
                                user.set_password(os.getenv('DEFAULT_PASSWORD'))
                                user.role=type
                                user.save()
                            name_shareholder = data[i]['customersList'][j]["shareholders"][k]["name"]
                            percent = data[i]['customersList'][j]["shareholders"][k]["percent"]
                            giaonhan = data[i]['customersList'][j]["shareholders"][k]["formula"]
                            shareholder, created_sh = ShareHolder.objects.get_or_create(
                                username=name_shareholder,
                                phantram = percent,
                                giaonhan=giaonhan,
                                users=user
                            )
                            thanhtien = data[i]['customersList'][j]["shareholders"][k]["total"]
                            sh_cus = ShareholderCustomer.objects.create(
                                shareholders=shareholder,
                                customers = customer,
                                thanhtien = thanhtien,
                                date = today
                            )
                            sh_cus.save()
                        except Exception as e:
                            print(f"Error with Create new User and Shareholder in insert_shareholder_to_db function: {e}")

        except Exception as e:
            print(e)


    def insert_data_to_db(self, data_cleaned, from_date): #[{}, {}, {}, {}, {}]
        try:


            list_users = self.insert_user_to_db(data_cleaned)
            self.insert_customer_and_customerData_to_db(list_users, data_cleaned, from_date)
            self.insert_shareholder_to_db(data_cleaned, from_date)
            

            return list_users


        except Exception as e:
            print("Error in insert data to database function: ", e)
                    

    
    def run_crawl_job(self):
        now = self.get_vietname_timezone()
        logger.info(f"Checking crawl job at {now}")
        # username = os.getenv('USERNAME_LOGIN')
        # password = os.getenv('PASSWORD_LOGIN')
        # yseterday = date.today() - timedelta(days=1)
        
        date_query = date.today()
        from_date = date_query.strftime("%d/%m/%Y")
        to_date = date_query.strftime("%d/%m/%Y")

        
        logger.info("Starting scheduled crawl")
        try:

            data = self.crawl_data(from_date, to_date)

            print("get data okk!")
                
            list = self.insert_data_to_db(data, date_query)

            print(list)
               
            return True
                
        except Exception as e:
            logger.error(f"Job failed: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f'Crawl job failed: {str(e)}')
            )
            return False
    

    def run_worker(self):
        """Main Worker loop that run indefinitely"""
        try:
            while True:

                work_done =  self.run_crawl_job()
                if work_done:
                    break
                sleep_time.sleep(60 - datetime.now().second)
        except Exception as e:
            logger.critical(f"Woker crashed: {str(e)}", exc_info=True)
    

