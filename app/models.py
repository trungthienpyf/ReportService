from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Create your models here.

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MACHINE', 'Machine'),
        ('SHAREHOLDER', 'ShareHolder'),
        ('ACCOUNTANT', 'Accountant'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    name = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"



class Customer(models.Model):
    id =  models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customers') #machine

class CustomerData(models.Model):
    laive = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)  # cần chỉnh sửa về như thắng thua
    customers = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='dialy_data', null=True)
    thangthua = models.DecimalField(max_digits=10, decimal_places=3)
    tongcuoc = models.DecimalField(max_digits=10, decimal_places=3 ,null=True, blank=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['customers', 'date', 'thangthua']  # One entry per customer per day
        ordering = ['-date']  # Most recent first

    def __str__(self):
        return f"{self.customer.name} - {self.date}"

class ShareHolder(models.Model):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=255)
    phantram = models.FloatField()
    giaonhan = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)

    users = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shareholders', null=True, blank =True)# machine, admin, accountant

    # tên cổ đông, phần trăm, giao nhận, user phải độc lập khác nhau
    class Meta:
        unique_together = ['username', 'phantram', 'giaonhan', 'users']





class ShareholderCustomer(models.Model):
    id = models.BigAutoField(primary_key=True)
    shareholders = models.ForeignKey(ShareHolder, on_delete=models.CASCADE, related_name='shareholder_customer', null=True, blank=True)
    customers = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='shareholder_customer', null=True, blank=True)
    thanhtien = models.DecimalField(max_digits=10, decimal_places=3 ,null=True, blank=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at =models.DateTimeField(auto_now=True)
        


class Report(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    users = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports', null=True, blank =True)

    fromDate = models.DateField(default=timezone.now) # xem xét chổ này kỹ hơn
    toDate =models.DateField(default=timezone.now) # xem xét chổ này kỹ hơn
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # class Meta:
    #     unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.name} - {self.users.username}"
    


