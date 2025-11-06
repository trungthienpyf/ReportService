import re
import json
import os
from collections import defaultdict




def group_customers_by_machine(data):
    # First, flatten the list of lists into a single list of customers
    all_customers = []
    for sublist in data:
        all_customers.extend(sublist)
    
    # Now group by machine_id
    machine_groups = defaultdict(list)
    
    for customer in all_customers:
        machine_id = customer['machine_id']
        machine_groups[machine_id].append(customer)
    
    # Convert to desired format
    result = []
    for machine_id, customers in machine_groups.items():
        machine_info = {
            'id': machine_id,
            'username': customers[0]['machine_name'],
            'customersList': customers
        }
        result.append(machine_info)
    
    return result



def save_json_to_file(data, filename='data_ngay_01_09_2025.json'):
    """
    Save JSON data to a file in the same directory as the script
    
    Args:
        data: List of dictionaries (JSON array of objects)
        filename (str): Name of the file to save to (default: 'test.json')
    """
    try:
        # Get the directory of the current script file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, filename)
        
        # Validate that data is a list
        if not isinstance(data, list):
            raise ValueError("Data must be a list (array) of objects")
        
        # Validate that all items in the list are dictionaries
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(f"Item at index {i} is not a dictionary")
        
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        
        print(f"Data successfully saved to: {file_path}")
        return True
        
    except ValueError as ve:
        print(f"Validation error: {ve}")
        return False
    except Exception as e:
        print(f"Error saving data: {e}")
        return False


def convert_to_float(value):
    if value.startswith('-'):
        # Xử lý số âm
        if ',' in value:
            # Thay dấu phẩy bằng dấu chấm
            return float(value.replace(',', '.'))
        else:
            # Xóa dấu trừ, thêm '0.' và thêm lại dấu trừ
            return float('-' + '0.' + value[1:])
    else:
        # Xử lý số dương
        if ',' in value:
            return float(value.replace(',', '.'))
        else:
            ccc = '0,'+value
            return float(ccc.replace(',', '.'))


def read_json_from_file(filename='data_ngay_08_09_2025.json'):

    """
    Read JSON data from a file in the same directory as the script
    
    Args:
        filename (str): Name of the file to read from (default: 'test.json')
    
    Returns:
        List of dictionaries with preserved types, or None if error occurs
    """
    try:
        # Get the directory of the current script file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, filename)
        
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Validate that loaded data is a list
        if not isinstance(data, list):
            raise ValueError("Loaded data is not a list (array)")
        
        # Validate that all items in the list are dictionaries
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(f"Item at index {i} is not a dictionary")
        
        print(f"Data successfully loaded from: {file_path}")
        return data
        
    except FileNotFoundError:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, filename)
        print(f"File not found: {file_path}")
        return None
    except json.JSONDecodeError:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, filename)
        print(f"Error decoding JSON from: {file_path}")
        return None
    except ValueError as ve:
        print(f"Validation error: {ve}")
        return None
    except Exception as e:
        print(f"Error reading data: {e}")
        return None
    
def split_by_first_space(text):
    """
    Split a string by the first space encountered.
    
    Args:
        text (str): The input string to split
        
    Returns:
        list: A list containing two elements - the part before the first space 
              and the part after the first space. If no space is found, 
              returns the original string as the first element and empty string as second.
    """
    return text.split(' ', 1)


def extract_div_texts(html_string):
    if html_string =="":
        return None
    pattern = r'<div[^>]*>(.*?)<\\?/div>'
    
    # Find all matches
    matches = re.findall(pattern, html_string)
    
    # Clean up the extracted text (remove any remaining escape characters)
    cleaned_matches = [match.replace('\\', '') for match in matches]
    
    return cleaned_matches


