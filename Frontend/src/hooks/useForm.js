import { useState } from 'react';

export const useForm = (initialValues, validateFn) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setValues({
      ...values,
      [name]: value
    });
    
    if (touched[name] && validateFn) {
      const fieldErrors = validateFn({
        ...values,
        [name]: value
      });
      
      setErrors(fieldErrors);
    }
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    
    setTouched({
      ...touched,
      [name]: true
    });
    
    if (validateFn) {
      const fieldErrors = validateFn(values);
      setErrors(fieldErrors);
    }
  };
  
  const handleSubmit = (submitFn) => (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Validate all fields
    if (validateFn) {
      const fieldErrors = validateFn(values);
      setErrors(fieldErrors);
      
      // Only proceed if no errors
      if (Object.keys(fieldErrors).length === 0) {
        submitFn(values);
      }
    } else {
      submitFn(values);
    }
  };
  
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues
  };
};