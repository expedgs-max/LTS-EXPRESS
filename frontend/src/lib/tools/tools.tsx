
// Define or import the FormatDate function
export const FormatDate = (dateString: string, locale: string = 'en-GB', timeZone: string = 'Africa/Algiers') => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    day: '2-digit',
    month: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: timeZone,
    hour12: false, // <--- This forces 24-hour format (no AM/PM)
  };

  // Format date with a fixed locale and time zone
  return new Date(dateString).toLocaleDateString(locale, options);
};


export const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const inputValue = (event.target as HTMLInputElement).value;
  if (!/^\d*$/.test(inputValue)) {
    (event.target as HTMLInputElement).value = inputValue.replace(/\D/g, ''); // Remove non-numeric characters
  }
};

// Function to calculate the difference between two dates
export function getDateDifference(dateString: string): string {
  // Parse the given date string into a Date object
  const givenDate = new Date(dateString);

  // Get the current date
  const currentDate = new Date();

  // Calculate the difference in milliseconds
  const differenceInMs = currentDate.getTime() - givenDate.getTime();

  // Handle cases where the given date is in the past
  if (differenceInMs < 0) {
    return "0";
  }

  // Convert the difference into days, hours, minutes, and seconds
  const msInSecond = 1000;
  const msInMinute = msInSecond * 60;
  const msInHour = msInMinute * 60;
  const msInDay = msInHour * 24;

  const days = Math.floor(differenceInMs / msInDay);
  const hours = Math.floor((differenceInMs % msInDay) / msInHour);
  const minutes = Math.floor((differenceInMs % msInHour) / msInMinute);

  // Format the result
  return `${days !== 0 ? (days + " days") : ""}  ${hours !== 0 && days === 0 ? (hours + " hours") : ""}  ${hours === 0 && days === 0 ? (minutes + "minutes") : ""}`;
}


export const Utils = {
  months: ({ count }: { count: number }) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames.slice(0, count); // Return the first `count` months
  }
};

export const UtilsDay = {
  months: ({ count }: { count: number }) => {
    const monthNames = [
      '01', '02', '03', '04', '05', '06', '07',
      '08', '09', '10', '11', '12', '13', '14', '15',
      '16', '17', '18', '19', '20', '21', '22', '23',
      '24', '25', '26', '27', '28', '29', '30'
    ];
    return monthNames.slice(0, count); // Return the first `count` months
  }
};

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';

  if (url.startsWith('data:') || url.startsWith('/placeholder') || url.startsWith('/icon') || url.startsWith('/favicon')) {
    return url;
  }

  if (url.includes('/media/')) {
    return url.substring(url.indexOf('/media/'));
  }
  if (url.includes('/images/')) {
    return url.substring(url.indexOf('/images/'));
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.match(/^https?:\/\/(192\.168\.\d+\.\d+|127\.0\.0\.1|localhost)(:\d+)?/)) {
      const cleanPath = url.replace(/^https?:\/\/[^\/]+/, '');
      return cleanPath.startsWith('/media/') || cleanPath.startsWith('/images/')
        ? cleanPath
        : `/media${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    }
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  return path.startsWith('/media/') || path.startsWith('/images/') ? path : `/media${path}`;
};