// TODO: The publicly exposed parts of this should be in lib/SSCGridUtils.
import validator from 'validator';

export function getValidationObj({type, helpText}) {
  const vs = {
    required: {
      matchFunc: value => !validator.isEmpty(value),
      helpText: () => '必须输入该字段！'
    },
    email: {
      matchFunc: value => validator.isEmail(value),
      helpText: () => '请输入正确的邮箱格式！'
    },
    decimal: {
      matchFunc: value => validator.isDecimal(value),
      helpText: () => '请输入正确的数字格式！'
    },
    currency: {
      matchFunc: value => validator.isDecimal(value),
      helpText: () => '请输入正确的货币格式！'
    },
    int: {
      matchFunc: value => validator.isInt(value),
      helpText: () => '请输入正确的整数格式！'
    },
    mobilePhone: {
      matchFunc: value => validator.isMobilePhone(value, 'zh-CN'),
      helpText: () => '请输入正确的手机号格式!'
    },
    length: {
      /**
       * options = {min: 3, max: 6}
       */
      matchFunc: (value, options) => validator.isLength(value, options),
      helpText: (options) => `输入长度必须介于 ${options.min} 和 ${options.max} 之间的字符串`
    }
  };

  let validationObj = vs[type];
  if (helpText) {
    // 自定义错误提示
    validationObj.helpText = helpText;
  }

  return validationObj;
}

/**
 * 校验字段是否不为'error'
 * @param {String|null} vstate react-bootstrap的验证状态
 * @param {Boolean}
 */
export function isFieldValid(vstate) {
  return vstate !== 'error';
}

/**
 * 判断校验对象是否全部正确
 * @param {Object} states
 * ```
 * {
 *   email: 'error',
 *   name: 'success'
 * }
 * ```
 * @return {boolean}
 */
export function isStatesValid(states) {
  let isAllValid = true;
  let fieldId;

  // 遍历检查每个需要校验的字段的状态
  for (fieldId in states) {
    if (states.hasOwnProperty(fieldId)) {
      isAllValid = isAllValid && isFieldValid(states[fieldId]);
    }
  }

  return isAllValid;
}

/**
 * 对一个字段进行校验
 * @param {String} value
 * @param {Array} validators
 * @return {Object} 校验之后的状态和提示信息
 * ```json
 * {
 *   validationState: 'error',
 *   helpText: '请输入正确的邮箱地址'
 * }
 * ```
 */
export function calcValidationState(value, validators) {
  let validationState = 'success';
  let helpTexts = '';
  validators.forEach(v => {
    const { matchFunc, helpText } = v.type === 'custom'
      ? v
      : getValidationObj(v);
    let isValid = matchFunc(value, v.options);
    if (!isValid) {
      validationState = 'error';
      helpTexts += '\n' + helpText(v.options);
    }
  });
  return {
    validationState,
    helpText: helpTexts
  };
}
