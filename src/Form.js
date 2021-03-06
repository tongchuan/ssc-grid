import classNames from 'classnames';
import React, { Component, PropTypes } from 'react';

import { Button, FormGroup, ControlLabel, HelpBlock } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import * as ReactBootstrap from 'react-bootstrap';
// 表单(form)控件(control/widget)
import { FormControl, Checkbox } from 'react-bootstrap';

// YBZSAAS-461
// IE11不支持Array.prototype.find()
import 'core-js/fn/array/find';

import * as validationUtils from './utils/validation';
import * as actions from './Form.actions';

/**
 * 控件(control/widget)分类
 * Command input: Button, Drop-down list, ...
 * Data input-output: Checkbox Color picker Combo box Cycle button Date Picker Grid view List box List builder Radio button Scrollbar Search box Slider Spinner Text box
 * 来源：https://en.wikipedia.org/wiki/Widget_(GUI)
 */

// 使用我们自己造的轮子
import TextField from './TextField';
import DatePicker from './DatePicker';
import { Refers } from 'ssc-refer';

/**
 * helper functions
 */

/**
 * @param {Array|Null} validators 当不需要校验的时候为null
 * @return {boolean} 当是必选项的时候，输出true否则为false
 */
function showRequiredStar(validators) {
  if (!validators) {
    return false;
  }
  return validators.find(({type}) => type === 'required') !== undefined;
}

export default class Form extends Component {
  static propTypes = {
    /**
     * 表单中的数据
     * 字段类型type:
     * - `string` 字符类型
     * - `double` 数值类型
     * - `date` 日期类型
     * - `boolean` 布尔类型
     * - `ref` 参照类型
     * - `custom` 自定义类型
     * 比如：
     * ```json
     * [
     *   {
     *     type: 'string',
     *     id: 'formValidationEmail',
     *     label: '邮箱地址',
     *     validators: [
     *       {type: 'email'}
     *     ]
     *   },
     *   {
     *    type: 'custom',
     *    component: <CustomComponent>
     *   }
     * ]
     * ```
     * 对于自定义类型，需要调用者传入一个组件，下面提供了组件接口：
     * ```
     * propTypes: {
     *   value: React.PropTypes.string,
     *   onChange: React.PropTypes.func
     * },
     * ```
     * 校验类型，比如
     * validators: [
     *   {type: 'required'},
     *   {type: 'length', min: 3, max: 6,
     *     helpText: '字符串长度应该大于等于3小于等于6'}
     * ]
     * <code>type</code>字段支持如下类型：
     * <ul>
     * <li><code>email</code>邮件地址</li>
     * <li><code>decimal</code>数字，比如0.1, .3, 1.1, 1.00003, 4.0</li>
     * <li><code>int</code>整数</li>
     * <li><code>mobilePhone</code>手机号</li>
     * <li><code>custom</code>自定义格式</li>
     * </ul>
     * <code>helpText</code>是错误提示。如果不提供，则使用默认错误提示。<br>
     * 如果是自定义类型，则通过<code>matchFunc</code>参数传递校验函数
     * ```
     * {
     *   type: 'custom',
     *   helpText: '请输入正确的XX格式',
     *   matchFunc: () => {}
     * }
     * ```
     * 当<code>matchFunc</code>返回值为true的时候，认为校验通过<br>
     * 对于自定义类型，如果不提供<code>helpText</code>，则默认不显示错误提示。
     * 参照类型，字段定义举例：
     * ```js
     * {
     *   type: 'ref',
     *   referConfig: {
     *     referConditions: {
     *       refCode: 'org',
     *       refType: 'tree',
     *       rootName: '组织'
     *     },
     *     referDataUrl: 'http://127.0.0.1:3009/refbase_ctr/queryRefJSON',
     *     renderMenuItemChildren: (option, props, index) => ([
     *       <div>{option.code + ' ' + option.name}</div>
     *     ])
     *     labelKey: 'name'
     *   }
     * }
     * ```
     * 所有`referConfig`下的属性直接向下传递给`Refers`组件，
     * 比如`referConfig = { foo: 'bar' }`，那么就相当于
     * ```jsx
     * <Refers
     *   foo="bar"
     * />
     * ```
     * 关于`Refers`组件的属性定义，详见[ssc-refer](https://ssc-refer.github.io/components.html)
     */
    fieldsModel: PropTypes.oneOfType([
      PropTypes.array, // 默认类型应该是数组，但是为了支持mobx传入observable object...
      PropTypes.object
    ]).isRequired,
    /**
     * 填充表单值<br>
     * 时间类型比较特殊，请先转成
     * <a href="http://en.wikipedia.org/wiki/ISO_8601">ISO 8601</a>格式的字符串
     * 之后，再传进来。
     * ```
     * defaultData = {
     *   date: new Date('2017-02-14').toISOString()
     * }
     * ```
     */
    defaultData: PropTypes.object,
    /**
     * 自定义布局（bootstrap列布局）
     * ```js
     * {
     *   columnCount: 3
     *   columnWidth: 4
     * }
     * ```
     */
    layout: PropTypes.shape({
      columnCount: React.PropTypes.number,
      columnWidth: React.PropTypes.number
    }),
    /**
     * 当控件的值发生改变的时候触发
     * @param {String} `fieldId` 也就是传入组件中fieldsModel中的id<br>
     * @param {String} `value` 改变之后的值<br>
     * @param {Object} `opt` 可选参数，当type为string/boolean/enum等简单类型的时候，可以
     *             通过opt.event获取Event对象。<br>
     *             当type为date类型的时候，可以通过opt.formattedValue获取格式化
     *             之后的时间值。<br>
     */
    onChange: PropTypes.func,
    /**
     * 当表单被提交的时候触发<br>
     * 参数1. `formData`, 整个表单中所有控件的值，是一个JSON对象，结构和传入参数
     *                  defaultData保持一致。<br>
     */
    onSubmit: PropTypes.func,
    /**
     * 当点击“重置”按钮的时候
     */
    onReset: PropTypes.func
  };

  constructor(props) {
    super(props);
    /**
     * 暂时只用于使用ref获取子组件的校验状态
     * 结构示例
     * ```
     * {
     *   id: {TextField},
     *   name: {TextField}
     * }
     * ```
     */
    this.fieldRefs = {};
    this.state = {
      /**
       * 记录当前表单的验证状态，这是一个键值对，其中key表示字段id，value表示
       * 验证状态，用户需要自己判断所有字段是否都验证通过了
       * 验证状态，验证状态分三种:
       * - 'success' 验证成功
       * - 'error' 验证失败
       * - null 未知状态，比如TextField组件刚mount上的时候，还不知道验证状态，
       * 除非触发了一次onChange事件，或者onSubmit才能知道其验证状态
       * ```
       * {
       *   email: 'success',
       *   name: 'error',
       *   name2: null
       * }
       * 字段email是fieldId, 'success'是验证状态
       * 这是react-bootstrap中关于form validation的直接映射
       * ```
       */
      fieldsValidationState: {},
      /**
       * 验证失败时候显示的帮助信息
       * ```
       * {
       *   email: '请输入正确的邮件地址',
       *   name: '请输入必选项内容'
       * }
       * ```
       * 这是react-bootstrap中关于form validation的直接映射
       */
      fieldsHelpText: {},
      formData: {...this.props.defaultData},
      /**
       * 提交按钮是否被禁用
       * 当值为true的时候，提交按钮的样式为“禁用”
       */
      submitButtonDisabled: false
    };

    // 初始化表单项的验证状态，全部为null
    this.props.fieldsModel.forEach(fieldModel => {
      if (fieldModel.validators) {
        this.state.fieldsValidationState[fieldModel.id] = null;
        this.state.fieldsHelpText[fieldModel.id] = '';
      }
    });

    // 如果是枚举型，默认使用第一个选项的值
    this.props.fieldsModel.forEach(fieldModel => {
      if (fieldModel.type === 'enum') {
        // 当值为空（null/undefined）的时候，需要计算一下默认值，默认选择第一条
        if (!this.state.formData[fieldModel.id]) {
          this.state.formData[fieldModel.id] = fieldModel.data[0].key;
        }
      }
    });

    // 构建用于进行布局的表单
    if (this.props.layout) {
      let rowIdx = 0;
      let colIdx = 0;
      this.layoutFieldsModel = [];
      this.props.fieldsModel.forEach((fieldModel) => {
        if (!this.layoutFieldsModel[rowIdx]) {
          this.layoutFieldsModel[rowIdx] = [];
        }
        if (colIdx === this.props.layout.columnCount) {
          this.layoutFieldsModel[++rowIdx] = [];
          colIdx = 0;
        }
        this.layoutFieldsModel[rowIdx].push(fieldModel);
        if (fieldModel.type !== 'hidden') {
          colIdx++;
        }
      });
    }
  }

  componentWillMount() {
  }

  componentDidMount() {
  }

  /**
   * 这里只处理简单类型的控件，比如input, select, checkbox
   * 不处理复杂类型的空间，比如date-picker
   */
  handleChange(fieldId, validators, event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    // const name = target.name;

    this.setState(
      actions.updateFieldValue(fieldId, value)
    );

    // 如果该字段需要校验，那么设置校验状态
    if (validators) {
      this.setState(
        actions.updateFormFieldValidationState(fieldId, value, validators),
        (/* prevState, props */) => {
          // 现在校验状态来决定提交按钮的状态
          this.setState(actions.updateSubmitButtonState());
        }
      );
    }

    if (this.props.onChange) {
      this.props.onChange(fieldId, value, {
        event
      });
    }
  }

  // 只处理date-picker控件
  handleDatePickerChange(fieldId, value, formattedValue) {
    const newState = { ...this.state };
    newState.formData[fieldId] = value;
    this.setState(newState);

    if (this.props.onChange) {
      this.props.onChange(fieldId, value, {
        formattedValue
      });
    }
  }

  /**
   * 参照修改后的回调
   * @param {String} fieldId
   * @param {Array} selected
   * 目前不清楚为什么selected返回一个数组
   * 先不管三七二十一，直接扔到state中，让用户可以获取到
   * ```
   * selected = [
   *   {
   *     "id": "0500CC91-4A98-4C1D-A4D6-C6A0ABCC53AD",
   *     "isLeaf": "true",
   *     "name": "服务中心",
   *     "pid": "",
   *     "code": "02"
   *   }
   * ]
   * ```
   */
  handleReferChange(fieldId, validators, selected) {
    // 清空或者设置新值
    this.setState(actions.updateReferFieldValue(fieldId, selected), () => {});

    // 参照组件会多次调用onChange回调，即使没有发生change
    if (selected && selected.length === 0) {
      return;
    }

    // 如果该字段需要校验，那么设置校验状态
    if (validators) {
      // 参照是一个复杂类型的值，需要专门处理。
      let value = '';
      // 对参照的API不了解，所以写死获取第一个
      if (selected && selected[0]) {
        value = selected[0].name || '';
      } else {
        value = '';
      }

      this.setState(
        actions.updateFormFieldValidationState(fieldId, value, validators),
        (/* prevState, props */) => {
          // 现在校验状态来决定提交按钮的状态
          this.setState(actions.updateSubmitButtonState());
        }
      );
    }
  }

  /**
   * 参照回调
   * @param {String} fieldId
   * @param {Array} validators
   * @param {Event} event
   */
  handleReferBlur(/* fieldId, validators, event */) {
  }

  /**
   * 自定义类型字段发生变化的时候
   * @param {String} fieldId 字段ID
   * @param {*} value value为动态类型，具体类型由`CustomComponent.prop.value`的类型决定
   */
  handleCustomFieldChange(fieldId, value) {
    this.setState(
      actions.updateFieldValue(fieldId, value)
    );

    if (this.props.onChange) {
      this.props.onChange(fieldId, value, {
        event
      });
    }
  }

  handleSubmit(event) {
    const { formData } = this.state;
    const { fieldsModel } = this.props;

    // 更新所有字段的校验状态，并更新提交按钮的状态，最后再给用户回调
    this.setState(
      actions.updateAllFormFieldsValidationState(fieldsModel, formData),
      (/* prevState, props */) => {
        // 现在校验状态来决定提交按钮的状态
        this.setState(
          actions.updateSubmitButtonState()
        );
        if (validationUtils.isStatesValid(this.state.fieldsValidationState)) {
          if (this.props.onSubmit) {
            this.props.onSubmit(formData);
          }
        }
      }
    );
    event.preventDefault();
  }

  handleReset(event) {
    if (this.props.onReset) {
      this.props.onReset(event);
    }
  }

  /**
   * [stateful] 由于state只存储了所有字段的验证状态，所以需要专门计算一下总的状态
   * 可以用在验证表单是否允许提交
   * @return {boolean} 验证状态
   * - true 所有字段验证通过
   * - false 有一个或者多个字段验证失败
   * ({name: null, age: null}) => (true)
   * ({name: 'success', age: 'success'}) => (true)
   * ({name: 'success', age: 'error'}) => (false)
   */
  isAllFieldsValid() {
    const { fieldsValidationState } = this.state;
    return validationUtils.isStatesValid(fieldsValidationState);
  }

  /**
   * 校验状态
   */
  getFieldValidationState(fieldId) {
    return this.state.fieldsValidationState[fieldId];
  }

  /**
   * 校验帮助信息
   */
  getFieldHelpText(fieldId) {
    return this.state.fieldsHelpText[fieldId];
  }

  genLayoutFormGroup(fieldModel, index) {
    const { id, type, label, placeholder, validators } = fieldModel;
    let formGroup, formCtrl;

    // 隐藏字段
    if (fieldModel.hidden === true) {
      return null;
    }

    function getDefaultFormGroup(key, fieldId, fieldLabel, fieldFormCtrl, fm,
      validationState, helpText
    ) {
      return (
        <FormGroup
          key={key}
          controlId={`formControl-${fieldId}`}
          validationState={validationState}
        >
          <Col sm={2}>
            {}
          </Col>
          <Col componentClass={ControlLabel} sm={2}>
          <div>
            {fieldLabel}
            {
              typeof validators === 'object'
              ? <span style={{ color: 'red' }}>
                  {showRequiredStar(validators) ? '*' : null}
                </span>
              : null
            }
            </div>
          </Col>
          <Col sm={5}>
            {fieldFormCtrl}
            {
              typeof validators === 'object' && fm.type !== 'ref'
              ? <FormControl.Feedback />
              : null
            }
            {
              typeof validators === 'object'
              ? <HelpBlock>{helpText}</HelpBlock>
              : null
            }
          </Col>
          <Col sm={3}>
            {}
          </Col>
        </FormGroup>
      );
    }

    // 根据字段类型，生成不同的表单控件
    // 每个类型后面跟着的数字是后端传过来的datatype，这里提到的后端是
    // 用友自己的后端，Form组件并不依赖这些datetype数值，写在这里只是
    // 为了用友程序员调试方便。
    switch (type) {
      default:
      case 'string': // 0
      case 'double': // 2
        formCtrl = (
          <TextField
            label={label}
            value={this.state.formData[id]}
            placeholder={placeholder}
            onChange={this.handleChange.bind(this, id, validators)}
          />
        );
        formGroup = getDefaultFormGroup(index, id, label, formCtrl, fieldModel,
          this.getFieldValidationState(id),
          (
            validationUtils.isFieldValid(this.state.fieldsValidationState[id])
            ? null
            : this.getFieldHelpText(id)
          )
        );
        break;
      case 'date': // 3
        // 注意value的格式
        // value = new Date().toISOString()
        formCtrl = (
          <DatePicker
            value={this.state.formData[id]}
            onChange={this.handleDatePickerChange.bind(this, id)}
          />
        );
        formGroup = getDefaultFormGroup(index, id, label, formCtrl, fieldModel);
        break;
      case 'boolean': // 4
        formCtrl = (
          <Checkbox checked={this.state.formData[id]}
            onChange={this.handleChange.bind(this, id, validators)}
          />
        );
        formGroup = getDefaultFormGroup(index, id, label, formCtrl, fieldModel);
        break;
      case 'ref': // 5
        const referValue = this.state.formData[id];
        let defaultData = [];
        if (referValue && referValue.id && referValue.code && referValue.name) {
          defaultData[0] = { ...referValue };
        }
        if (fieldModel.referConfig) {
          // 参照的示例数据
          // ```js
          // defaultData =   [{
          //   "id": "02EDD0F9-F384-43BF-9398-5E5781DAC5D0",
          //   "code": "0502",
          //   "name": "二车间",
          //   "pid": "",
          //   "isLeaf": "true"
          // }];
          // fieldModel.referConfig = {
          //   referConditions: {"refCode":"dept","refType":"tree","rootName":"部门"};
          //   referDataUrl: "http://10.3.14.239/ficloud/refbase_ctr/queryRefJSON";
          // }
          // ```
          formCtrl = (
            <Refers
              {...fieldModel.referConfig}
              labelKey={fieldModel.referConfig.labelKey || 'name'}
              disabled={false}
              minLength={0}
              align="justify"
              emptyLabel=""
              multiple={false}
              onChange={this.handleReferChange.bind(this, id, validators)}
              onBlur={this.handleReferBlur.bind(this, id, validators)}
              placeholder="请选择..."
              referType="list"
              defaultSelected={defaultData}
              ref={ref => this._myrefers = ref}
            />
          );
        } else {
          // fallback到纯文本框
          formCtrl = (
            <TextField
              key={index}
              controlId={'formControl-' + id}
              label={label}
              value={this.state.formData[id]}
              placeholder={placeholder}
              inForm
              onChange={this.handleChange.bind(this, id, validators)}
            />
          );
        }
        formGroup = getDefaultFormGroup(index, id, label, formCtrl, fieldModel,
          this.getFieldValidationState(id),
          (
            validationUtils.isFieldValid(this.state.fieldsValidationState[id])
            ? null
            : this.getFieldHelpText(id)
          )
        );
        break;
      case 'enum': // 6
        formCtrl = (
          <FormControl
            componentClass="select"
            placeholder={placeholder || '请选择'}
            value={this.state.formData[id]}
            onChange={this.handleChange.bind(this, id, validators)}
          >
            {fieldModel.data.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
          </FormControl>
        );
        formGroup = getDefaultFormGroup(index, id, label, formCtrl, fieldModel,
          this.getFieldValidationState(id),
          (
            validationUtils.isFieldValid(this.state.fieldsValidationState[id])
            ? null
            : this.getFieldHelpText(id)
          )
        );
        break;
      case 'custom': // 后端没有该类型，这是前端自己定义的
        formCtrl = (
          <fieldModel.component
            customFieldValue={this.state.formData[id]}
            onCustomFieldChange={this.handleCustomFieldChange.bind(this, id)}
          />
        );
        formGroup = getDefaultFormGroup(index, id, label, formCtrl, fieldModel);
        break;
      case 'hidden':
        formGroup = (
          <input
            key={index}
            type="hidden"
            value={this.state.formData[id]}
          />
        );
    }
    return formGroup;
  }

  genField(fieldModel) {
    const { id, type, label, placeholder, validators } = fieldModel;
    let formGroup, formCtrl;

    // 隐藏字段
    if (fieldModel.hidden === true) {
      return null;
    }

    function getDefaultFormGroup(fieldId, fieldLabel, fieldFormCtrl, fm,
      validationState, helpText
    ) {
      return (
        <FormGroup
          controlId={`formControl-${fieldId}`}
          validationState={validationState}
        >
          <ControlLabel>{fieldLabel}</ControlLabel>
          <span style={{ color: 'red' }}>
            {showRequiredStar(validators) ? '*' : null}
          </span>
          {fieldFormCtrl}
          {fm.type !== 'ref' ? <FormControl.Feedback /> : null}
          <HelpBlock>{helpText}</HelpBlock>
        </FormGroup>
      );
    }

    // 根据字段类型，生成不同的表单控件
    // 每个类型后面跟着的数字是后端传过来的datatype，这里提到的后端是
    // 用友自己的后端，Form组件并不依赖这些datetype数值，写在这里只是
    // 为了用友程序员调试方便。
    switch (type) {
      default:
      case 'string': // 0
      case 'double': // 2
        formCtrl = (
          <TextField
            label={label}
            value={this.state.formData[id]}
            placeholder={placeholder}
            onChange={this.handleChange.bind(this, id, validators)}
          />
        );
        formGroup = getDefaultFormGroup(id, label, formCtrl, fieldModel,
          this.getFieldValidationState(id),
          (
            validationUtils.isFieldValid(this.state.fieldsValidationState[id])
            ? null
            : this.getFieldHelpText(id)
          )
        );
        break;
      case 'date': // 3
        // 注意value的格式
        // value = new Date().toISOString()
        formCtrl = (
          <DatePicker
            value={this.state.formData[id]}
            onChange={this.handleDatePickerChange.bind(this, id)}
          />
        );
        formGroup = getDefaultFormGroup(id, label, formCtrl, fieldModel);
        break;
      case 'boolean': // 4
        formCtrl = (
          <Checkbox checked={this.state.formData[id]}
            onChange={this.handleChange.bind(this, id, validators)}
          />
        );
        formGroup = getDefaultFormGroup(id, label, formCtrl, fieldModel);
        break;
      case 'ref': // 5
        const referValue = this.state.formData[id];
        let defaultData = [];
        if (referValue && referValue.id && referValue.code && referValue.name) {
          defaultData[0] = { ...referValue };
        }
        if (fieldModel.referConfig) {
          // 参照的示例数据
          // ```js
          // defaultData =   [{
          //   "id": "02EDD0F9-F384-43BF-9398-5E5781DAC5D0",
          //   "code": "0502",
          //   "name": "二车间",
          //   "pid": "",
          //   "isLeaf": "true"
          // }];
          // fieldModel.referConfig = {
          //   referConditions: {"refCode":"dept","refType":"tree","rootName":"部门"};
          //   referDataUrl: "http://10.3.14.239/ficloud/refbase_ctr/queryRefJSON";
          // }
          // ```
          formCtrl = (
            <Refers
              {...fieldModel.referConfig}
              disabled={false}
              minLength={0}
              align="justify"
              emptyLabel=""
              multiple={false}
              onChange={this.handleReferChange.bind(this, id, validators)}
              onBlur={this.handleReferBlur.bind(this, id, validators)}
              placeholder="请选择..."
              referType="list"
              defaultSelected={defaultData}
              ref={ref => this._myrefers = ref}
            />
          );
        } else {
          // fallback到纯文本框
          formCtrl = (
            <TextField
              controlId={'formControl-' + id}
              label={label}
              value={this.state.formData[id]}
              placeholder={placeholder}
              inForm
              onChange={this.handleChange.bind(this, id, validators)}
            />
          );
        }
        formGroup = getDefaultFormGroup(id, label, formCtrl, fieldModel,
          this.getFieldValidationState(id),
          (
            validationUtils.isFieldValid(this.state.fieldsValidationState[id])
            ? null
            : this.getFieldHelpText(id)
          )
        );
        break;
      case 'enum': // 6
        formCtrl = (
          <FormControl
            componentClass="select"
            placeholder={placeholder || '请选择'}
            value={this.state.formData[id]}
            onChange={this.handleChange.bind(this, id, validators)}
          >
            {fieldModel.data.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
          </FormControl>
        );
        formGroup = getDefaultFormGroup(id, label, formCtrl, fieldModel,
          this.getFieldValidationState(id),
          (
            validationUtils.isFieldValid(this.state.fieldsValidationState[id])
            ? null
            : this.getFieldHelpText(id)
          )
        );
        break;
      case 'custom': // 后端没有该类型，这是前端自己定义的
        formCtrl = (
          <fieldModel.component
            customFieldValue={this.state.formData[id]}
            onCustomFieldChange={this.handleCustomFieldChange.bind(this, id)}
          />
        );
        formGroup = getDefaultFormGroup(id, label, formCtrl, fieldModel);
        break;
      case 'hidden':
        formGroup = (
          <input
            type="hidden"
            value={this.state.formData[id]}
          />
        );
    }
    return formGroup;
  }

  render() {
    let form;
    if (this.props.layout) {
      const FormCol = ({fieldModel}) => (
        fieldModel.type === 'hidden' || fieldModel.hidden === true
        ? this.genField(fieldModel)
        : (
            <ReactBootstrap.Col md={this.props.layout.columnWidth}>
              {this.genField(fieldModel)}
            </ReactBootstrap.Col>
          )
      );
      const FormRow = ({rowFieldsModel}) => (
        <ReactBootstrap.Row>
        {
          rowFieldsModel.map((fieldModel, index) => (
            <FormCol key={index} fieldModel={fieldModel} />
          ))
        }
        </ReactBootstrap.Row>
      );
      form = (
        <ReactBootstrap.Form inline className={classNames(this.props.className)}>
          <ReactBootstrap.Grid>
            {
              this.layoutFieldsModel.map((fieldsModel, index) => (
                <FormRow key={index} rowFieldsModel={fieldsModel} />
              ))
            }
            <ReactBootstrap.Row>
              <ReactBootstrap.Col className={'text-center'}>
                <FormGroup>
                  <Button bsStyle="info" onClick={this.handleReset.bind(this)} type="reset">
                    取消
                  </Button>
                  {' '}
                  <Button
                    bsStyle="info"
                    type="submit"
                    disabled={this.state.submitButtonDisabled}
                    onClick={this.handleSubmit.bind(this)}
                  >完成</Button>
                </FormGroup>
              </ReactBootstrap.Col>
            </ReactBootstrap.Row>
          </ReactBootstrap.Grid>
        </ReactBootstrap.Form>
      );
    } else {
      form = (
        <ReactBootstrap.Form horizontal className={classNames(this.props.className)}>
          {
            this.props.fieldsModel.map(this.genLayoutFormGroup.bind(this))
          }
          <FormGroup>
            <Col sm={12} className={'text-center'}>
              <Button bsStyle="info" onClick={this.handleReset.bind(this)} type="reset">
                取消
              </Button>
              {' '}
              <Button
                bsStyle="info"
                type="submit"
                disabled={this.state.submitButtonDisabled}
                onClick={this.handleSubmit.bind(this)}
              >完成</Button>
            </Col>
          </FormGroup>
        </ReactBootstrap.Form>
      );
    }
    return form;
  }
}
