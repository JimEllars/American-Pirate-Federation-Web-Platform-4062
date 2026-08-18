/* 
  SafeIcon Wrapper 
  Ensures icons fail gracefully and follow the system's rendering standards.
*/
import React from 'react';
import * as FiIcons from 'react-icons/fi';

const { FiAlertTriangle } = FiIcons;

const SafeIcon = ({ icon, name, className, ...props }) => {
  let IconComponent = icon;

  if (!IconComponent && name) {
    try {
      // Safely access the icon or fallback
      IconComponent = FiIcons[`Fi${name}`];
    } catch (e) {
      IconComponent = null;
    }
  }

  // Ensure it's actually a valid component/function before rendering
  if (!IconComponent || typeof IconComponent !== 'function') {
    return <FiAlertTriangle className={className} {...props} />;
  }

  try {
    return <IconComponent className={className} {...props} />;
  } catch (error) {
    console.warn(`[SafeIcon] Failed to render icon: ${name}`, error);
    return <FiAlertTriangle className={className} {...props} />;
  }
};

export default SafeIcon;
