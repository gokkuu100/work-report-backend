from datetime import date, timedelta

def calculate_leave_days(start_date: date, end_date: date) -> int:
    """Calculate the number of leave days between two dates, excluding Sundays."""
    if start_date > end_date:
        return 0
    
    days = 0
    current = start_date
    while current <= end_date:
        # weekday() returns 0 for Monday, 6 for Sunday
        if current.weekday() != 6:
            days += 1
        current += timedelta(days=1)
    
    return days
