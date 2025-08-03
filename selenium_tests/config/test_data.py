"""
测试数据配置
包含各种测试场景所需的数据
"""
from faker import Faker
import random
import string

fake = Faker('zh_CN')  # 使用中文本地化

class TestData:
    """测试数据类"""
    
    # 用户注册/登录测试数据
    VALID_PHONE_NUMBERS = [
        '13800138000',
        '13900139000', 
        '15800158000'
    ]
    
    INVALID_PHONE_NUMBERS = [
        '1234567890',      # 长度不够
        '12345678901',     # 不是手机号格式
        '10800138000',     # 不是有效的手机号段
        'abcdefghijk',     # 非数字
        ''                 # 空字符串
    ]
    
    VALID_VERIFICATION_CODES = [
        '123456',
        '000000',  # 测试环境可能使用的通用验证码
        '888888'
    ]
    
    INVALID_VERIFICATION_CODES = [
        '12345',      # 长度不够
        '1234567',    # 长度过长
        'abcdef',     # 非数字
        '000001',     # 错误的验证码
        ''            # 空字符串
    ]
    
    # 个人信息测试数据
    USER_PROFILES = [
        {
            'name': '张三',
            'gender': 'male',
            'year': 1990,
            'month': 5,
            'day': 15,
            'hour': 10,
            'minute': 30,
            'province': '北京市',
            'city': '北京市',
            'district': '朝阳区'
        },
        {
            'name': '李四',
            'gender': 'female', 
            'year': 1995,
            'month': 8,
            'day': 20,
            'hour': 14,
            'minute': 45,
            'province': '上海市',
            'city': '上海市',
            'district': '浦东新区'
        },
        {
            'name': '王五',
            'gender': 'male',
            'year': 1988,
            'month': 12,
            'day': 3,
            'hour': 8,
            'minute': 0,
            'province': '广东省',
            'city': '深圳市',
            'district': '南山区'
        }
    ]
    
    # 无效的个人信息数据
    INVALID_USER_PROFILES = [
        {
            'name': '',  # 空姓名
            'gender': 'male',
            'year': 1990,
            'month': 5,
            'day': 15
        },
        {
            'name': '测试用户',
            'gender': 'male',
            'year': 1800,  # 无效年份
            'month': 5,
            'day': 15
        },
        {
            'name': '测试用户',
            'gender': 'male',
            'year': 1990,
            'month': 13,  # 无效月份
            'day': 15
        }
    ]
    
    # 兑换码测试数据
    VALID_INVITE_CODES = [
        'TEST1234ABCD5678',  # 16位测试兑换码
        'DEMO9876EFGH1234'
    ]
    
    INVALID_INVITE_CODES = [
        'SHORT123',          # 长度不够
        'TOOLONGCODE123456789',  # 长度过长
        'INVALID@CODE123',   # 包含特殊字符
        ''                   # 空字符串
    ]
    
    @staticmethod
    def generate_random_phone():
        """生成随机手机号"""
        prefixes = ['138', '139', '150', '151', '152', '158', '159', '188', '189']
        prefix = random.choice(prefixes)
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        return prefix + suffix
    
    @staticmethod
    def generate_random_name():
        """生成随机中文姓名"""
        return fake.name()
    
    @staticmethod
    def generate_random_invite_code():
        """生成随机16位兑换码"""
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(16))
    
    @staticmethod
    def generate_random_profile():
        """生成随机用户资料"""
        return {
            'name': TestData.generate_random_name(),
            'gender': random.choice(['male', 'female']),
            'year': random.randint(1970, 2005),
            'month': random.randint(1, 12),
            'day': random.randint(1, 28),
            'hour': random.randint(0, 23),
            'minute': random.randint(0, 59),
            'province': random.choice(['北京市', '上海市', '广东省', '浙江省', '江苏省']),
            'city': random.choice(['北京市', '上海市', '深圳市', '杭州市', '南京市']),
            'district': random.choice(['朝阳区', '浦东新区', '南山区', '西湖区', '鼓楼区'])
        }
