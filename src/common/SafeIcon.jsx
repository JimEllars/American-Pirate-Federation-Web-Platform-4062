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
      IconComponent = FiIcons[`Fi${name}`];
    } catch (e) {
      IconComponent = null;
    }
  }

  if (!IconComponent) {
    return <FiAlertTriangle className={className} {...props} />;
  }

  return <IconComponent className={className} {...props} />;
};

export default SafeIcon;
