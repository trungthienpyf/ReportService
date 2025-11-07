from django.shortcuts import render, redirect
from django.contrib import messages
import datetime
from django.template.loader import get_template
from django.template import loader
from django.http import HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from django.views.decorators.http import require_POST
# from .models import Statistics, PercentageTable
from .models import User, Customer, ShareHolder, ShareholderCustomer, Report, CustomerData
import json
from . import models
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import status
from django.db.models import Sum
from django.views.decorators.http import require_http_methods
from django.db.models import DecimalField



from django.core.exceptions import PermissionDenied




@csrf_exempt
@require_POST
def login_view(request):
    if request.method =='POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            print(user.role)
            login(request, user)
            # Redirect all users to the same route - accountingPage will handle the template
            return redirect('app:index')
        else:
            return redirect('app:login')
            
    return render(request, 'login.html')
 
@login_required
@csrf_exempt
def adminPage(request):
        # kiêm tra nếu đăng nhập với role nào thì query dữ liệu theo role đó
    if not request.user.is_authenticated:
        
        return redirect('app:login')

    
    print("login okk")
    shareholder_list = []
    customer_list = []
    user = User.objects.get(username = request.user.username)
    shareholders = ShareHolder.objects.filter(users = user)
    customers = Customer.objects.all()
    for shareholder in shareholders:
        shareholder_list.append(shareholder.username)

    for customer in customers:
        customer_list.append(customer.name)
 

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'data': "Login okk"}, safe =False)
    else:
        context= {
            'active_page': 'account',
            'shareholder_list': shareholder_list,
            'customer_list': customer_list
        }
        return render(request, 'admin.html', context)



@csrf_exempt
def loginPage(request):
    return render(request, 'login.html', {'massage': 'login page'})

@login_required
@csrf_exempt
def logout_view(request):
    logout(request)
    return redirect('app:login')


def parse_ddmmyyyy(date_str):
    ngay, thang, nam = map(int, date_str.split('/'))
    return datetime.date(nam, thang, ngay)


@csrf_exempt
@login_required
def get_statistics_by_date(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET method allowed'}, status=405)
    
    # Get date range from request GET parameters
    from_date_str = request.GET.get('from_date')
    to_date_str = request.GET.get('to_date')
    
    if not from_date_str or not to_date_str:
        return JsonResponse({'error': 'from_date and to_date are required'}, status=400)
    
    # Convert string dates using your parse_ddmmyyyy function
    try:
        from_date = parse_ddmmyyyy(from_date_str)
        to_date = parse_ddmmyyyy(to_date_str)
    except (ValueError, AttributeError) as e:
        return JsonResponse({'error': f'Invalid date format. Use DD/MM/YYYY. Error: {str(e)}'}, status=400)
    
    user = request.user
    
    if user.role == 'MACHINE':
        return get_machine_statistics(request, user, from_date, to_date)
    elif user.role in ['ACCOUNTANT', 'ADMIN']:
        return get_accountant_admin_statistics(request, user, from_date, to_date)
    else:
        return JsonResponse({'error': 'Unauthorized role'}, status=403)
    


def get_machine_statistics(request, user, from_date, to_date):
    # Get shareholders for this machine
    shareholders = ShareHolder.objects.filter(users=user)
    
    # Get customers that have data within the given date range for this machine
    customers_with_data = Customer.objects.filter(
        user=user,
        dialy_data__date__range=[from_date, to_date]
    ).distinct()
    
    customer_data = []
    total_thangthua = 0.0
    total_tongcuoc = 0.0
    total_laive = 0.0
    
    for customer in customers_with_data:
        # Get customer data within date range
        customer_datas = CustomerData.objects.filter(
            customers=customer,
            date__range=[from_date, to_date]
        )
        
        # Calculate sums for thangthua, tongcuoc, and laive
        thangthua_result = customer_datas.aggregate(
            total_thangthua=Sum('thangthua', output_field=DecimalField())
        )
        thangthua_sum = thangthua_result['total_thangthua'] or 0.0
        
        tongcuoc_result = customer_datas.aggregate(
            total_tongcuoc=Sum('tongcuoc', output_field=DecimalField())
        )
        tongcuoc_sum = tongcuoc_result['total_tongcuoc'] or 0.0
        
        laive_result = customer_datas.aggregate(
            total_laive=Sum('laive', output_field=DecimalField())
        )
        laive_sum = laive_result['total_laive'] or 0.0
        
        # Add to totals
        total_thangthua += float(thangthua_sum)
        total_tongcuoc += float(tongcuoc_sum)
        total_laive += float(laive_sum)
        
        # Get unique shareholders for this customer within date range
        unique_shareholders = ShareholderCustomer.objects.filter(
            customers=customer,
            shareholders__in=shareholders,
            date__range=[from_date, to_date]
        ).values('shareholders').distinct()
        
        codong = []
        phantram = []
        giaonhan = []
        thanhtien = []
        
        for shareholder_data in unique_shareholders:
            shareholder_id = shareholder_data['shareholders']
            shareholder = ShareHolder.objects.get(id=shareholder_id)
            
            # Calculate total thanhtien for this shareholder-customer combination in date range
            shareholder_result = ShareholderCustomer.objects.filter(
                shareholders=shareholder,
                customers=customer,
                date__range=[from_date, to_date]
            ).aggregate(
                total_thanhtien=Sum('thanhtien', output_field=DecimalField())
            )
            shareholder_sum = shareholder_result['total_thanhtien'] or 0.0
            
            codong.append(shareholder.username)
            phantram.append(str(shareholder.phantram))
            giaonhan.append(shareholder.giaonhan or "")
            thanhtien.append(float(shareholder_sum))
        
        customer_info = {
            'customer_id': customer.id,
            'customer_name': customer.name,
            'thangthua': float(thangthua_sum),
            'tongcuoc': float(tongcuoc_sum),
            'laive': float(laive_sum),  # Added laive field
            'codong': codong,
            'phantram': phantram,
            'giaonhan': giaonhan,
            'thanhtien': thanhtien
        }
        
        customer_data.append(customer_info)
    
    # Add total row as the last item
    total_row = {
        'id': 0,
        'customer_name': 'tổng cộng',
        'thangthua': total_thangthua,
        'tongcuoc': total_tongcuoc,
        'laive': total_laive,  # Added total laive
        'codong': [],
        'phantram': [],
        'giaonhan': [],
        'thanhtien': []
    }
    customer_data.append(total_row)
    
    # Check if it's an AJAX request
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse(customer_data, safe=False, status=200)
    else:
        context = {
            'active_page': 'account',
            'all_statis': customer_data
        }
        return render(request, 'accounting.html', context)


def get_accountant_admin_statistics(request, user, from_date, to_date):
    # Get all machine users
    machine_users = User.objects.filter(role='MACHINE')
    
    result_data = []
    global_total_thangthua = 0.0
    global_total_tongcuoc = 0.0
    global_total_laive = 0.0
    
    # Get all shareholders for the logged-in accountant/admin
    shareholders = ShareHolder.objects.filter(users=user)
    
    for machine_user in machine_users:
        # Get customers that have data within the given date range for this machine
        customers_with_data = Customer.objects.filter(
            user=machine_user,
            dialy_data__date__range=[from_date, to_date]
        ).distinct()
        
        machine_tongcuoc_total = 0.0
        machine_thangthua_total = 0.0
        machine_laive_total = 0.0
        customers_list = []
        
        for customer in customers_with_data:
            # Get customer data within date range
            customer_datas = CustomerData.objects.filter(
                customers=customer,
                date__range=[from_date, to_date]
            )
            
            # Calculate sums for this customer
            thangthua_result = customer_datas.aggregate(
                total_thangthua=Sum('thangthua', output_field=DecimalField())
            )
            thangthua_sum = thangthua_result['total_thangthua'] or 0.0
            
            tongcuoc_result = customer_datas.aggregate(
                total_tongcuoc=Sum('tongcuoc', output_field=DecimalField())
            )
            tongcuoc_sum = tongcuoc_result['total_tongcuoc'] or 0.0
            
            laive_result = customer_datas.aggregate(
                total_laive=Sum('laive', output_field=DecimalField())
            )
            laive_sum = laive_result['total_laive'] or 0.0
            
            # Add to machine totals
            machine_thangthua_total += float(thangthua_sum)
            machine_tongcuoc_total += float(tongcuoc_sum)
            machine_laive_total += float(laive_sum)
            
            # Get unique shareholders for this customer within date range
            # Only get shareholders that belong to the logged-in accountant/admin
            unique_shareholders = ShareholderCustomer.objects.filter(
                customers=customer,
                shareholders__in=shareholders,
                date__range=[from_date, to_date]
            ).values('shareholders').distinct()
            
            codong = []
            phantram = []
            giaonhan = []
            thanhtien = []
            
            for shareholder_data in unique_shareholders:
                shareholder_id = shareholder_data['shareholders']
                shareholder = ShareHolder.objects.get(id=shareholder_id)
                
                # Calculate total thanhtien for this shareholder-customer combination in date range
                shareholder_result = ShareholderCustomer.objects.filter(
                    shareholders=shareholder,
                    customers=customer,
                    date__range=[from_date, to_date]
                ).aggregate(
                    total_thanhtien=Sum('thanhtien', output_field=DecimalField())
                )
                shareholder_sum = shareholder_result['total_thanhtien'] or 0.0
                
                codong.append(shareholder.username)
                phantram.append(str(shareholder.phantram))
                giaonhan.append(shareholder.giaonhan or "")
                thanhtien.append(float(shareholder_sum))
            
            customer_info = {
                "customer_id": customer.id,
                "customer_name": customer.name,
                "thangthua": float(thangthua_sum),
                "tongcuoc": float(tongcuoc_sum),
                "laive": float(laive_sum),  # Added laive field
                "phantram": phantram,
                "codong": codong,
                "giaonhan": giaonhan,
                "thanhtien": thanhtien
            }
            
            customers_list.append(customer_info)
        
        # Only include machine if it has customers with data in the date range
        if customers_list:
            # Add machine total row as the last item for this machine
            machine_total_row = {
                "customer_id": 0,
                "customer_name": "total",
                "thangthua": machine_thangthua_total,
                "tongcuoc": machine_tongcuoc_total,
                "laive": machine_laive_total,  # Added laive to machine total
                "phantram": [],
                "codong": [],
                "giaonhan": [],
                "thanhtien": []
            }
            customers_list.append(machine_total_row)
            
            # Add to global totals
            global_total_thangthua += machine_thangthua_total
            global_total_tongcuoc += machine_tongcuoc_total
            global_total_laive += machine_laive_total
            
            machine_data = {
                "id": machine_user.id,
                "username": machine_user.username,
                "tongcuoc": machine_tongcuoc_total,
                "thangthua": machine_thangthua_total,
                "laive": machine_laive_total,  # Added laive to machine data
                "customersList": customers_list
            }
            
            result_data.append(machine_data)
    
    # Add global total row as the last machine
    global_total_machine = {
        "id": 0,
        "username": "Tổng",
        "tongcuoc": global_total_tongcuoc,
        "thangthua": global_total_thangthua,
        "laive": global_total_laive,  # Added laive to global total
        "customersList": [
            {
                "customer_id": 0,
                "customer_name": "total",
                "thangthua": global_total_thangthua,
                "tongcuoc": global_total_tongcuoc,
                "laive": global_total_laive,  # Added laive to global customer list
                "phantram": [],
                "codong": [],
                "giaonhan": [],
                "thanhtien": []
            }
        ]
    }
    result_data.append(global_total_machine)
    
    # Check if it's an AJAX request
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse(result_data, safe=False, status=200)
    else:
        context = {
            'active_page': 'accounting',
            'all_statis': result_data
        }
        return render(request, 'admin.html', context)



@login_required
@csrf_exempt
def create_data_new_day(request):
    user = User.objects.get(username =request.user.username)
    try:
        if user.role =='MACHINE':
            try:
                data=json.loads(request.body)
                fromDate = data.get('date')
                customers_data = data.get('customers', [])

                fromDateParse = parse_ddmmyyyy(fromDate)
                previous_day = fromDateParse - datetime.timedelta(days=1)


                for cus in customers_data:
                    thangthua = float(cus['thangthua'].replace(',', ''))
                    # tongcuoc = float(cus['tongcuoc'].replace(',', ''))
                    # laive = float(cus['laive'].replace(',', ''))
                    laive = cus['laive']
                    tongcuoc = cus['tongcuoc']
                    if laive != '':
                        laive = float(cus['laive'].replace(',', ''))
                    else:
                        laive=None
                    if tongcuoc!='':
                        tongcuoc = float(cus['tongcuoc'].replace(',', ''))
                    else:
                        tongcuoc=None
                    
                    customer= Customer.objects.get(name =cus['customer_name'], user=user)
                    customerData = CustomerData.objects.create(
                        thangthua=thangthua,
                        laive=laive, 
                        tongcuoc=tongcuoc,
                        customers=customer,
                        date=fromDateParse
                    )
                    customerData.save()

                    yesterday_shareholder = ShareholderCustomer.objects.filter(
                        customers = customer,
                        date=previous_day
                    ).select_related('shareholders')

                    for yesterday_entry in yesterday_shareholder:
                        shareholder = yesterday_entry.shareholders

                        giaonhan = shareholder.giaonhan
                        phantram = shareholder.phantram

                        phantram_tinh = phantram /100

                        if giaonhan == " (Nhận -)":
                            phantram_tinh = phantram_tinh * (-1)
                        
                        sh_cus = ShareholderCustomer.objects.create(
                            shareholders = shareholder,
                            customers =customer,
                            thanhtien = phantram_tinh * thangthua,
                            date=fromDateParse
                        )
                        sh_cus.save()                    

                return JsonResponse({"message": "ok", "data": "nguyen nhat hai"}, status=200)

            except Exception as e:
                return JsonResponse({"message":"loi load data", "data": e}, status=500)
        if user.role in ['ACCOUNTANT', 'ADMIN']:
            try:
                data_admin=json.loads(request.body)
                fromDate_admin = data_admin.get('date')
                customers_data_admin = data_admin.get('customers', [])
                machine = data_admin.get('machine')

                fromDateParse = parse_ddmmyyyy(fromDate_admin)
                previous_day = fromDateParse - datetime.timedelta(days=1)

                machine  = User.objects.get(username=machine)
                for cus in customers_data_admin:
                    thangthua = float(cus['thangthua'].replace(',', ''))
                    laive = cus['laive']
                    tongcuoc = cus['tongcuoc']
                    if laive != '':
                        laive = float(cus['laive'].replace(',', ''))
                    else:
                        laive=None
                    if tongcuoc!='':
                        tongcuoc = float(cus['tongcuoc'].replace(',', ''))
                    else:
                        tongcuoc=None
                    customer= Customer.objects.get(name =cus['customer_name'], user=machine)
                    customerData = CustomerData.objects.create(
                        thangthua=thangthua,
                        laive=laive, 
                        tongcuoc=tongcuoc,
                        customers=customer,
                        date=fromDateParse
                    )
                    customerData.save()

                    yesterday_shareholder = ShareholderCustomer.objects.filter(
                        customers = customer,
                        date=previous_day
                    ).select_related('shareholders')

                    for yesterday_entry in yesterday_shareholder:
                        shareholder = yesterday_entry.shareholders

                        giaonhan = shareholder.giaonhan
                        phantram = shareholder.phantram

                        phantram_tinh = phantram /100

                        if giaonhan == " (Nhận -)":
                            phantram_tinh = phantram_tinh * (-1)
                        
                        sh_cus = ShareholderCustomer.objects.create(
                            shareholders = shareholder,
                            customers =customer,
                            thanhtien = phantram_tinh * thangthua,
                            date=fromDateParse
                        )
                        sh_cus.save()      

                return JsonResponse({"message":"nguyen nhat hai", "data": "ok"}, status=200)
            except Exception as e:
                return JsonResponse({"message":"Loi load data from admin", "data": e}, status=500)
            
    
    except Exception as e:
        return JsonResponse({"message":"loi get user", "data": e}, status=500)
    



@login_required
@csrf_exempt
def get_customer(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            machine_name = data.get('machine')

            
            # Get the user object for the selected machine
            machine_user = User.objects.get(username=machine_name, role='MACHINE')
            
            # Get customers for this machine user
            customers = Customer.objects.filter(user=machine_user)
            
            customer_list = []
            for customer in customers:
                customer_list.append({
                    'id': customer.id,
                    'name': customer.name,
                    'value': customer.id  # For compatibility with existing code
                })
            
            return JsonResponse({
                'success': True,
                'customers': customer_list
            })
            
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Máy không tồn tại'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Method not allowed'
    }, status=405)

# thêm cổ đông bằng dấu cộng ở bảng
@csrf_exempt
@require_POST
@login_required
def createShareholer(request):
    user = User.objects.get(username = request.user.username)
    if user.role=='MACHINE':
        try:
            
            data = json.loads(request.body)
            
            id = data.get('id')
            
            tenKhachHang = data.get('tenKhachHang')
            thangthua = data.get('thangthua')
            tongcuoc = data.get('tongcuoc')
            codong = data.get('codong')
            codong_moi = data.get('codong_moi')
            phantram = data.get('phantram')
            giaonhan = data.get('giaonhan')
            fromDate = data.get('fromDate')
            isCreateNewShareholder = data.get('isNewShareholder')
            
            if giaonhan == True:
                giaonhan_text=" (Nhận -)"
                phantram_tinh = -float(phantram) /100
            else:
                giaonhan_text=" (Giao +)"
                phantram_tinh = float(phantram) /100

            date_parse = parse_ddmmyyyy(fromDate)
            customer = Customer.objects.get(name=tenKhachHang, user=user)
            thangthua_parse = float(thangthua.replace(',', ''))
            if isCreateNewShareholder==False:
                shareholder, created = ShareHolder.objects.get_or_create(
                    username = codong,
                    phantram=phantram,
                    giaonhan=giaonhan_text,
                    users = user
                )

                sh_cus = ShareholderCustomer.objects.create(
                    shareholders = shareholder,
                    customers=customer,
                    thanhtien = thangthua_parse* phantram_tinh, 
                    date=date_parse
                )
                sh_cus.save()
            else:
                new_shareholder = ShareHolder.objects.create(
                    username=codong_moi,
                    phantram=float(phantram),
                    giaonhan=giaonhan_text,
                    users= user
                )

                sh_cus_new = ShareholderCustomer(
                    customers = customer,
                    shareholders=new_shareholder,
                    thanhtien=thangthua_parse* phantram_tinh,
                    date=date_parse
                )
                sh_cus_new.save()


            
            return JsonResponse(
                        {"Message":"Add Shareholder Successfullly!",
                        "data":{"id":id}},status=200)

        except Exception as e:
            print(e)
            return JsonResponse({"error": e}, status=500)


@csrf_exempt
@login_required   
def addShareholderAdmin(request):
    print("dang goi ham them co dong o admin")
    try:
        user = User.objects.get(username=request.user.username)
        if user.role in ["ACCOUNTANT", "ADMIN"]:
            data = json.loads(request.body)
            
            
            tenKhachHang = data.get('tenKhachHang')
            machine_name =data.get('machine')
            thangthua = data.get('thangthua')
            tongcuoc = data.get('tongcuoc')
            codong = data.get('codong')
            codong_moi = data.get('tencodong_moi')
            is_new_sh = data.get('isNewShareholder') # boolean
            phantram = data.get('phantram')
            giaonhan = data.get('giaonhan') # boolean
            fromDate = data.get('fromDate')


            phantram_float = float(phantram)
            phantram_tinhtoan = phantram_float/100
            if giaonhan== False:
                giao_nhan_text = " (Nhận -)"
                phantram_tinhtoan = phantram_tinhtoan * (-1)
            else:
                giao_nhan_text =" (Giao +)"



            fromdate_parse = parse_ddmmyyyy(fromDate)

            thangthua_parse = float(thangthua.replace(',', ''))
            machine = User.objects.get(username=machine_name)
            customer = Customer.objects.get(name=tenKhachHang, user=machine)
            if is_new_sh==False:
                
               #customerdata = CustomerData.objects.get(customers=customer, thangthua=thangthua_parse, date=fromdate_parse)
                shareholder, created_new = ShareHolder.objects.get_or_create(
                    username=codong,
                    phantram=phantram_float,
                    giaonhan=giao_nhan_text,
                    users = user

                )

                sh_cus = ShareholderCustomer.objects.create(
                    shareholders = shareholder,
                    customers=customer,
                    thanhtien = thangthua_parse* phantram_tinhtoan, 
                    date=fromdate_parse
                )
                sh_cus.save()
            else:
                shareholder_new = ShareHolder.objects.create(
                    username=codong_moi,
                    phantram=phantram_float,
                    giaonhan=giao_nhan_text,
                    users=user
                )

                sh_cus_new = ShareholderCustomer.objects.create(
                    customers=customer,
                    shareholders=shareholder_new,
                    thanhtien=thangthua_parse* phantram_tinhtoan,
                    date=fromdate_parse
                )
                sh_cus_new.save()






            return JsonResponse({
                "message": "nguyen nhat hai",
                "data": "testdata"
            }, status=200)
    except Exception as e:
        print(e)

    

@login_required
@csrf_exempt
def deleteShareholder(request):
    username = request.user.username
    user = User.objects.get(username=username)
    if user.role=='MACHINE':
        try:
            data = json.loads(request.body)
            tenKhachHang = data.get('tenKhachHang')
            codong = data.get('codong')
            phantram = data.get('phantram')
            fromDate = data.get('fromDate')
            giaonhan=data.get('giaonhan')
            fromDateParse = parse_ddmmyyyy(fromDate)
            
            #user = User.objects.get(username = username)
            shareholder = ShareHolder.objects.get(username = codong,phantram=float(phantram),giaonhan = giaonhan, users=user)
            customer = Customer.objects.get(name=tenKhachHang, user=user)
            sh_cus_data = ShareholderCustomer.objects.get(shareholders =shareholder,
                                             customers =customer, date = fromDateParse)
            sh_cus_data.delete()
        except Exception as e:
            print("Error with Delete Shareholder:", e)
    if user.role in ["ACCOUNTANT", "ADMIN"]:
        try:
            data = json.loads(request.body)
            machine_name = data.get('machine')
            tenKhachHang_admin = data.get('tenKhachHang')
            codong_admin = data.get('codong')
            phantram_codong = data.get('phantram')
            giaonhan_admin = data.get('giaonhan')
            fromDate_admin = data.get('fromDate')
            fromDateParse_admin = parse_ddmmyyyy(fromDate_admin)

            machine = User.objects.get(username=machine_name)

            customer = Customer.objects.get(name=tenKhachHang_admin, user=machine)

            phantram_float = float(phantram_codong)
            # đang có vấn đề tại đây
            shareholder = ShareHolder.objects.get(username = codong_admin, phantram=phantram_float, giaonhan=giaonhan_admin, users=user)# lấy cổ đông của kế toán và admin
            sh_cus_admin = ShareholderCustomer.objects.get(shareholders=shareholder, customers=customer, date=fromDateParse_admin)
            sh_cus_admin.delete()

        except Exception as e:
            print(e)

    return JsonResponse({
        "message":"Delete Shareholder successfully!"
    }, status=200)






@csrf_exempt
@login_required
def update_shareholer(request):
    user = User.objects.get(username=request.user.username)
    try:
        if user.role == 'MACHINE':
                
            data = json.loads(request.body)
            tenKhachHang = data.get('tenKhachHang')
            codong = data.get('codong')
            oldphantram = data.get('oldphantram')
            oldgiaonhan = data.get('oldgiaonhan')
            new_phantram = data.get('new_phantram')
            new_giaonhan = data.get('new_giaonhan')
            from_date = data.get('fromDate')
            fromDateParse = parse_ddmmyyyy(from_date)

            phantram = float(new_phantram) # new phantram to insert into shareholder database that create new shareholder
            phantram_tinh = phantram
            # xử lý giao nhận
            if new_giaonhan:
                new_giaonhantext = " (Nhận -)"
                phantram_tinh = phantram * (-1)
            else:
                new_giaonhantext = " (Giao +)"

            customer = Customer.objects.get(name=tenKhachHang, user=user)
            oldShareholder = ShareHolder.objects.get(username =codong, phantram=float(oldphantram), 
                                                     giaonhan=oldgiaonhan, users=user)
            customerdata = CustomerData.objects.get(customers=customer, date=fromDateParse)
            
            old_shareholder_customer = ShareholderCustomer.objects.get(customers=customer, 
                                                                       shareholders=oldShareholder, date= fromDateParse)
            old_thanhtien = old_shareholder_customer.thanhtien
            new_shareholder, created = ShareHolder.objects.get_or_create(
                username=codong,
                phantram=phantram, 
                giaonhan=new_giaonhantext,
                users=user
            )

            old_shareholder_customer.thanhtien = (phantram_tinh/100) * float(customerdata.thangthua)
            old_shareholder_customer.shareholders = new_shareholder
            old_shareholder_customer.save()

        
            return JsonResponse({
            "message":"update okk!",
            "data": "testdata"
            }, status=200)
        if user.role in ['ADMIN', 'ACCOUNTANT']:
            data_admin = json.loads(request.body)
            tenKhachHang_admin = data_admin.get('tenKhachHang')
            codong_admin = data_admin.get('codong')
            oldphantram_admin = data_admin.get('oldphantram')
            oldgiaonhan_admin = data_admin.get('oldgiaonhan')
            new_phantram_admin = data_admin.get('new_phantram')
            new_giaonhan_admin = data_admin.get('new_giaonhan')
            from_date_admin = data_admin.get('fromDate')
            machine_name =data_admin.get('machine')
            fromDateParse_admin = parse_ddmmyyyy(from_date_admin)

            phantram_admin = float(new_phantram_admin) # new phantram to insert into shareholder database that create new shareholder
            phantram_tinh_admin = phantram_admin
            # xử lý giao nhận
            if new_giaonhan_admin:
                new_giaonhantext_admin = " (Nhận -)"
                phantram_tinh_admin = phantram_admin * (-1)
            else:
                new_giaonhantext_admin = " (Giao +)"

            machine = User.objects.get(username= machine_name)
            customer_db = Customer.objects.get(name=tenKhachHang_admin, user=machine)
            customer_data_db = CustomerData.objects.get(customers=customer_db, date=fromDateParse_admin)

            shareholder_admin = ShareHolder.objects.get(username=codong_admin, 
                                                        phantram=float(oldphantram_admin),
                                                        giaonhan=oldgiaonhan_admin, users=user)
            sh_cus_admin = ShareholderCustomer.objects.get(customers=customer_db, shareholders = shareholder_admin,
                                                           date=fromDateParse_admin)
            new_sh_admin, created = ShareHolder.objects.get_or_create(
                username = codong_admin,
                phantram = phantram_admin,
                giaonhan =new_giaonhantext_admin,
                users = user
            )

            sh_cus_admin.thanhtien = (phantram_tinh_admin/100) * float(customer_data_db.thangthua)
            sh_cus_admin.shareholders = new_sh_admin
            sh_cus_admin.save()


            return JsonResponse({
                "message": "update ok!",
                "data": "admin"
                }, status=200)
        
    except Exception as e:
        return JsonResponse({"error":str(e)}, status=500)



@login_required
@csrf_exempt
def accountingPage(request):
    if not request.user.is_authenticated:
        return redirect('app:login')

    print("login okk")
    shareholder_list = []
    machine_list = []
    customer_list = []
    user = User.objects.get(username=request.user.username)
    
    # Check user role and adjust data accordingly
    if user.role in ['ACCOUNTANT', 'ADMIN']:  # Admin role
        shareholders = ShareHolder.objects.filter(users=user)
        machines = User.objects.filter(role='MACHINE')
        for machine in machines:
            machine_list.append(machine.username)
            customers = Customer.objects.filter(user=machine)  # Admin sees all customers
        template_name = 'admin.html'
    else:  # Normal user
        shareholders = ShareHolder.objects.filter(users=user)
        customers = Customer.objects.filter(user=user)
        template_name = 'accounting.html'


    for shareholder in shareholders:
        shareholder_list.append(shareholder.username)

    for customer in customers:
        customer_list.append(customer.name)

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'data': "Login okk"}, safe=False)
    else:
        context = {
            'active_page': 'account',
            'machine_list': machine_list,
            'shareholder_list': shareholder_list,
            'customer_list': customer_list
        }
        return render(request, template_name, context)




# cần chỉnh sửa hàm này
@login_required
@csrf_exempt
def addCustomer(request):
    user = User.objects.get(username = request.user.username)
    if user.role=="MACHINE":
        try:
            data = json.loads(request.body)
            customer_name = data.get('tenKhachHang')
            #shareholder_name = data.get('codong')
            is_new_customer = data.get('isNewCustomer') # boolean
            fromDate = data.get('fromDate')
            thangthua = data.get('thangthua')
            tongcuoc = data.get('tongcuoc')
            laive =data.get('laive')
            fromDate_parse = parse_ddmmyyyy(fromDate)

            thangthua_parse = float(thangthua.replace(',', ''))
            if tongcuoc !='':
                tongcuoc = float(tongcuoc.replace(',', ''))
            else:
                tongcuoc=None
            
            if laive != '':
                laive = float(laive.replace(',', '')) 
            else:
                laive=None
            # xử lý lai về như thắng thua và tổng cược
            
            if is_new_customer==False:
                customer = Customer.objects.get(name = customer_name)
                customerData =  CustomerData.objects.create(
                    customers = customer,
                    laive=laive,
                    thangthua = thangthua_parse,
                    tongcuoc=tongcuoc,
                    date=fromDate_parse
                )
                customerData.save()
                return JsonResponse({
                "message": "add customer okk"
            }, status =200)
            else:
                customer_create = Customer.objects.create(
                    name=customer_name,
                    user=user
                )
                customer_new_data = CustomerData.objects.create(
                    laive=laive,
                    thangthua=thangthua_parse,
                    tongcuoc=tongcuoc,
                    date=fromDate_parse,
                    customers=customer_create
                )
                customer_new_data.save()
                return JsonResponse({
                "message": "add customer okk"
            }, status =200)

            # if shareholder_name!="":
            #     shareholder = ShareHolder.objects.get(username=shareholder_name, users =user)
            #     if shareholder.giaonhan == " (Nhận -)":
            #         phantram = -(shareholder.phantram)/100
            #     else:
            #         phantram = (shareholder.phantram)/100
            #     thanhtien_cal = thangthua_parse * phantram
            #     sh_cus = ShareholderCustomer.objects.create(
            #         customers=customer,
            #         shareholders=shareholder,
            #         thanhtien=thanhtien_cal,
            #         date = fromDate_parse
            #     )
            #     sh_cus.save()

            # return JsonResponse({
            #     "message": "add customer okk"
            # }, status =200)


        except Exception as e:
            return JsonResponse({
                "message":e
            },status=500)
    if user.role in ["ADMIN", "ACCOUNTANT"]:
        try:
            data = json.loads(request.body)
            machine_name = data.get('tenmay')
            customer_name_admin = data.get('tenKhachHang')
            #shareholder_name_admin = data.get('codong')
            fromDate_admin = data.get('fromDate')
            thangthua_admin = data.get('thangthua')
            tongcuoc_admin = data.get('tongcuoc')
            laive_admin =data.get('laive')
            #phantram_from_client = data.get('phantram')
            is_new_customer_admin = data.get('is_new_customer')
            fromDate_parse_admin = parse_ddmmyyyy(fromDate_admin)


            if tongcuoc_admin !='':
                tongcuoc_admin = float(tongcuoc_admin.replace(',', ''))
            else:
                tongcuoc_admin=None
            
            if laive_admin != '':
                laive_admin = float(laive_admin.replace(',', '')) 
            else:
                laive_admin=None

            machine = User.objects.get(username=machine_name)
            

            thangthua_parse_admin = float(thangthua_admin.replace(',', ''))
            if is_new_customer_admin==False:
                customer = Customer.objects.get(name=customer_name_admin, user=machine)
                customer_data = CustomerData.objects.create(
                    laive=laive_admin,
                    tongcuoc=tongcuoc_admin, 
                    thangthua=thangthua_parse_admin,
                    customers=customer,
                    date=fromDate_parse_admin
                )
                customer_data.save()
            else:
                customer_create_new = Customer.objects.create(name =customer_name_admin, user=machine)
                cus_data_new = CustomerData.objects.create(
                                    laive=laive_admin,
                                    tongcuoc=tongcuoc_admin, 
                                    thangthua=thangthua_parse_admin,
                                    customers=customer_create_new,
                                    date=fromDate_parse_admin
                                )
                cus_data_new.save()

            # xử lý lai về như thắng thua


            # customerdata_admin = CustomerData.objects.create(
            #     customers=customer,
            #     thangthua=thangthua_parse_admin,
            #     tongcuoc=tongcuoc_parse_admin,
            #     laive=laive_parse_admin,
            #     date = fromDate_parse_admin
            # )
            # customerdata_admin.save()

            # if shareholder_name_admin !="":
            #     phantram_query = float(phantram_from_client)
            #     shareholder_admin = ShareHolder.objects.get(username=shareholder_name_admin,phantram=phantram_query, users =user)
            #     phantram_admin = (shareholder_admin.phantram)/100
            #     thanhtien_cal_admin = thangthua_parse_admin * phantram_admin
            #     sh_cus_admin = ShareholderCustomer.objects.create(
            #         customers=customer,
            #         shareholders=shareholder_admin,
            #         thanhtien=thanhtien_cal_admin,
            #         date = fromDate_parse_admin
            #     )
            #     sh_cus_admin.save()
            
            return JsonResponse({
                "message": "add customer okk"
            }, status =200) 

        except Exception as e:
            print(e)




@login_required
@csrf_exempt
def reportPage(request):
    if  request.user.is_authenticated:
        user_client = request.user.username
        user = User.objects.get(username = user_client)
        reports = Report.objects.filter(users=user)

        context ={
        'active_page':'baocao',
        'reports':reports
        }
    template_report= loader.get_template('report.html')
    return HttpResponse(template_report.render(context, request))

@login_required
@csrf_exempt
def createReport(request):
    data = json.loads(request.body)
    from_date = data.get('fromDate')
    to_date = data.get('toDate')
    user_from_client = data.get('user')

    user = User.objects.get(username =user_from_client)
    report = Report.objects.create(
        name = f"KT {from_date} đến {to_date}",
        fromDate = parse_ddmmyyyy(from_date),
        toDate = parse_ddmmyyyy(to_date),
        users = user
    )
    report.save()

    return JsonResponse({
        "message":"Create Report Successfully!"
    }, status=200)







@login_required
@csrf_exempt
def reportDetail(request, report_id):
    if request.user.is_authenticated:
        user = User.objects.get(username=request.user.username)
        
        # Get the report
        try:
            report = Report.objects.get(id=int(report_id), users=user)
            from_date = report.fromDate
            to_date = report.toDate
        except Report.DoesNotExist:
            return HttpResponse("Report not found", status=404)
        
        # Get shareholders for this user
        shareholders = ShareHolder.objects.filter(users=user)
        
        # Dictionary to group shareholders by name and track unique customers
        shareholder_groups = {}
        grand_total_thanhtien = 0
        grand_total_thangthua = 0
        grand_total_laive = 0
        
        for shareholder in shareholders:
            shareholder_name = shareholder.username
            
            if shareholder_name not in shareholder_groups:
                shareholder_groups[shareholder_name] = {
                    "sh_id": f"group_{shareholder_name}",
                    "name_sh": shareholder_name,
                    "thanhtien": 0,  # Total amount for shareholder group
                    "thangthua": 0,  # Total win/loss for shareholder group
                    "laive": 0,      # Total laive for shareholder group
                    "customerList": [],
                    "unique_customers": set()  # Track unique customer IDs to avoid duplicates
                }
            
            group_data = shareholder_groups[shareholder_name]
            
            # Get all ShareholderCustomer records for this shareholder in date range
            shareholder_customers = ShareholderCustomer.objects.filter(
                shareholders=shareholder,
                date__range=[from_date, to_date]
            ).select_related('customers')
            
            for sc in shareholder_customers:
                customer = sc.customers
                customer_id = customer.id
                
                # Only process this customer if it hasn't been added to this group yet
                if customer_id not in group_data["unique_customers"]:
                    # Calculate customer totals
                    customer_totals = CustomerData.objects.filter(
                        customers=customer,
                        date__range=[from_date, to_date]
                    ).aggregate(
                        total_thangthua=Sum('thangthua'),
                        total_tongcuoc=Sum('tongcuoc'),
                        total_laive=Sum('laive')
                    )
                    
                    # For thanhtien, we use the value from ShareholderCustomer directly
                    # No need to aggregate since each ShareholderCustomer record already has the total
                    customer_thanhtien = float(sc.thanhtien or 0)
                    
                    customer_data = {
                        'id': customer_id,
                        'username': customer.name,
                        'giaonhan': shareholder.giaonhan,
                        'phantram': shareholder.phantram,
                        'thangthua': float(customer_totals['total_thangthua'] or 0),
                        'tongcuoc': float(customer_totals['total_tongcuoc'] or 0),
                        'laive': float(customer_totals['total_laive'] or 0),
                        'thanhtien_khach': customer_thanhtien
                    }
                    
                    group_data["customerList"].append(customer_data)
                    group_data["unique_customers"].add(customer_id)
                    
                    # Update group totals by adding this customer's thanhtien
                    group_data["thanhtien"] += customer_thanhtien
                    group_data["thangthua"] += customer_data['thangthua']
                    group_data["laive"] += customer_data['laive']
                else:
                    # If customer already exists in group, find and update their thanhtien
                    for existing_customer in group_data["customerList"]:
                        if existing_customer['id'] == customer_id:
                            # Add the thanhtien from this shareholder-customer relationship
                            additional_thanhtien = float(sc.thanhtien or 0)
                            existing_customer['thanhtien_khach'] += additional_thanhtien
                            group_data["thanhtien"] += additional_thanhtien
                            break
        
        # Convert dictionary to list and calculate grand totals
        result_data = []
        for group_name, group_data in shareholder_groups.items():
            # Remove the temporary unique_customers set before adding to result
            del group_data["unique_customers"]
            result_data.append(group_data)
            
            # Update grand totals
            grand_total_thanhtien += group_data["thanhtien"]
            grand_total_thangthua += group_data["thangthua"]
            grand_total_laive += group_data["laive"]
        
        # Add grand totals to context
        context = {
            "ten": "Nguyen Nhat Hai",
            "reports": report,
            "data": result_data,
            "grand_total_thanhtien": grand_total_thanhtien,
            "grand_total_thangthua": grand_total_thangthua,
            "grand_total_laive": grand_total_laive
        }
        
        template_report = loader.get_template('report_detail1.html')
        return HttpResponse(template_report.render(context, request))
    
    return HttpResponse("Unauthorized", status=401)



@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
def deleteReport(request, report_id):
    if request.user.is_authenticated:

        try:
            user = User.objects.get(username = request.user.username)
            report =Report.objects.get(id=report_id, users=user)
            report.delete()
            return JsonResponse({"message": 'Report deleted successfully'}, status=200)
        except Report.DoesNotExist:
            return JsonResponse({"Message":"Report not found "}, status=404)
        

def get_user_from_request(request):
    """Get the authenticated user from request"""
    if request.user.is_authenticated:
        return request.user
    raise PermissionDenied("User not authenticated")




@login_required
@csrf_exempt
def memberPage(request):
    try:
        user = User.objects.get(username=request.user.username)
        
        # Get shareholders associated with the user
        shareholders = ShareHolder.objects.filter(users=user).order_by('username')
        
        shareholders_data = []
        
        for shareholder in shareholders:
            # Get all customer relationships for this shareholder
            shareholder_customers = ShareholderCustomer.objects.filter(
                shareholders=shareholder
            ).select_related('customers').order_by('customers__name', '-date')
            
            # Get unique customers with their latest data
            customers_data = []
            processed_customers = set()
            
            for sc in shareholder_customers:
                if sc.customers.id not in processed_customers:
                    customer_data = {
                        'customer_id': sc.customers.id,
                        'customer_name': sc.customers.name,
                        'giaonhan': shareholder.giaonhan or '',  # Get giaonhan from shareholder
                        'phantram': float(shareholder.phantram) if shareholder.phantram else 0.0,  # Get phantram from shareholder
                        'thanhtien': float(sc.thanhtien) if sc.thanhtien else 0.0,
                        'date': sc.date
                    }
                    customers_data.append(customer_data)
                    processed_customers.add(sc.customers.id)
                
            shareholder_data = {
                'id': shareholder.id,
                'name': shareholder.username,
                'giaonhan': shareholder.giaonhan or '',
                'phantram': float(shareholder.phantram) if shareholder.phantram else 0.0,
                'customers': customers_data,
                'created_at': shareholder.created_at,
                'updated_at': shareholder.updated_at
            }
            shareholders_data.append(shareholder_data)
        
        context = {
            'active_page': 'member',
            'shareholders': shareholders_data
        }
        
        template_member = loader.get_template('member.html')
        return HttpResponse(template_member.render(context, request))
        
    except PermissionDenied:
        context = {
            'active_page': 'member',
            'error': 'Please login to access this page'
        }
        template_member = loader.get_template('member.html')
        return HttpResponse(template_member.render(context, request))
    except Exception as e:
        context = {
            'active_page': 'member',
            'error': f'Failed to load member data: {str(e)}'
        }
        template_member = loader.get_template('member.html')
        return HttpResponse(template_member.render(context, request))