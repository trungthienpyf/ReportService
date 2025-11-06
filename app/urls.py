from django.urls import path
from . import views


app_name = 'app'

urlpatterns = [
    path('', views.loginPage, name='login'),
    path('login/', views.login_view, name ='loginfunction'),
    #path('statistics/', views.statistics_view, name='statisticsPage'),
    path('logout/', views.logout_view, name='logout'),
    path('report/', views.accountingPage, name='index'),

    
    # path('reportAdmin/', views.adminPage, name='index_admin'),

    path('api-create-new-day/', views.create_data_new_day, name='create_new_day'),

    path('api-get-customer/', views.get_customer, name='get_customer'),

    path('api-get-statistic', views.get_statistics_by_date, name='get_statistic_by_date'),
    path('api-update-shareholder/', views.update_shareholer, name = 'update_shareholder'),
    path('api-create-shareholder/', views.createShareholer, name = 'create_shareholder'),
    path('api-add-shareholderadmin/', views.addShareholderAdmin, name='create_shareholder_admin'),
    #path('report/account', views.accountingPage, name="accountingPage"),



    path('report/member', views.memberPage, name='memberPage'),

    #path('report/member', views.member_page, name='memberPage'),
    path('report/baocao', views.reportPage, name='reportPage'),
    path('createReport/', views.createReport,name ='create_report'),
    path('api/reports/<int:report_id>', views.deleteReport, name='delete_report'),
    path('report/detail/<int:report_id>/', views.reportDetail, name='report_detail'),
    path('api-delete-shareholder/', views.deleteShareholder, name="delete_shareholder"),
    path('api-add-customer/', views.addCustomer, name="add_customer"),

    
]