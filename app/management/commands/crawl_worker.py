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
    def handle(self, *args, **options):
        logger.info("Starting crawler worker service")
        self.run_worker()

    def get_vietname_timezone(self):
        return datetime.now(VIETNAM_TZ)
    

    # def get_statistic_data(self,api_url, session, token, from_date, to_date):


    #     # origin_url_page = 'https://treemind3.com'
    #     # statistic_url_page = "https://treemind3.com/statistic"
    #     origin_url_page = os.getenv('URL')
    #     statistic_url_page = os.getenv('STATS_PAGE')
    #     headers_get_date = {
    #         'User-Agent': 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36',
    #         'X-Requested-With': 'XMLHttpRequest',
    #         # 'Origin': 'https://treemind3.com',
    #         # 'Referer': "https://treemind3.com/statistic",
    #         'Origin': origin_url_page,
    #         'Referer': statistic_url_page,
    #     }


    #     form_data = {
    #         '_token': token,
    #         'date_start': from_date,
    #         'date_end': to_date
    #     }
    #     #print(f"{form_date['from_date']}, {form_date['to_date']}")


    #     response =session.post(api_url, data=form_data, headers = headers_get_date)
    #     if response.status_code ==200:
    #         try:
    #             return response.json()
    #         except:
    #             return response.text
    #     else:
    #         print("Request Failed:" , response.status_code)


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


    # def login_to_website(self,username, password, from_date, to_date):
    # # Create a session to maintain cookies
    #     session = requests.Session()
    
    # # Set headers to mimic a browser
    #     headers = {
    #     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    #     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    #     'Accept-Language': 'en-US,en;q=0.5',
    #     'Accept-Encoding': 'gzip, deflate',
    #     'Connection': 'keep-alive',
    # }
    
    #     try:
    #     # Step 1: Get the login page to extract any required tokens
    #         # login_page_url = 'https://treemind3.com/login'
    #         login_page_url = os.getenv('URL_LOGIN_PAGE')
    #         response = session.get(login_page_url, headers=headers)
    #         response.raise_for_status()  # Raise an error for bad status codes
        
    #     # Parse the HTML to find form fields
    #         soup = BeautifulSoup(response.text, 'html.parser')
        
    #     # Find the login form (adjust selector as needed)
    #         login_form = soup.find('form')
        
    #     # Extract all input fields from the form
    #         form_data = {}
    #         for input_tag in login_form.find_all('input'):
    #             name = input_tag.get('name')
    #             value = input_tag.get('value', '')
    #             if name:
    #                 form_data[name] = value
            
    #         # Step 2: Update with our credentials
    #         form_data['username'] = username  # Replace with actual field name
    #         form_data['password'] = password  # Replace with actual field name
            
        
    #     # Step 3: Submit to the form's action URL
    #         # action_url = 'https://treemind3.com/signin'
    #         action_url = os.getenv('SIGNIN')
        
    #     # If the action is relative, make it absolute
    #         if action_url.startswith('/'):
    #             from urllib.parse import urljoin
    #             action_url = urljoin(login_page_url, action_url)
        
    #     # Submit the login form
    #         response = session.post(action_url, data=form_data, headers=headers)
    #         response.raise_for_status()
        
    #     # Step 4: Check if login was successful
    #     # Method 1: Check if redirected away from login page
    #         if 'login' not in response.url.lower():
    #             print("Login successful! (Redirected away from login page)")
    #             #data = self.get_statistic_data("https://treemind3.com/api/statistic", session, form_data['_token'], from_date, to_date)
    #             data = self.get_statistic_data(os.getenv('URL_API_GET_DATA'), session, form_data['_token'], from_date, to_date)

    #             for item in data:
    #                 if "customersList" in item and isinstance(item["customersList"], dict):
    #                     item["customersList"] = list(item["customersList"].values())
                
    #             save_json_to_file(data) # về sau 
    #             return data

    #         print("Login status uncertain. Please check manually.")
    #         return None
        
    #     except requests.RequestException as e:
    #         print(f"Error during login process: {e}")
    #         return None


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
            with transaction.atomic():
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
            with transaction.atomic():
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

        if now.hour ==22 and now.minute ==00:
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
        # return False
    

    # def run_worker(self):
    #     """Main Worker loop that run indefinitely"""
    #     try:
    #         while True:

    #             work_done =  self.run_crawl_job()
    #             if work_done:
    #                 break
    #             sleep_time.sleep(60 - datetime.now().second)
    #     except Exception as e:
    #         logger.critical(f"Woker crashed: {str(e)}", exc_info=True)
    

