const tableData = [
  {'id': 3, 'cols': [
    {'value': '263X2016111400000081'},
    {'value': '2632'},
    {'value': '2.00'},
    {'value': '2016-11-14'},
    {value: true},
    {value: 'male'},
    {value: '组织1'}
  ]},
  {'id': 1, 'cols': [
    {'value': 'D32016091200000022'},
    {'value': 'D3'},
    {'value': '12.00'},
    {'value': '2016-09-12'},
    {value: false},
    {value: 'female'},
    {value: '组织2'}
  ]},
  {'id': 2, 'cols': [
    {'value': '263X2016083000000025'},
    {'value': '2631'},
    {'value': '100.00'},
    {'value': '2016-08-30'},
    {value: true},
    {value: 'male'},
    {value: '组织3'}
  ]}
];

const mockColumnsData = [
  {key: 'string', 'label': '单据编号'},
  {key: 'enum', 'label': '单据类型',
    data: [
      {key: '2631', value: '差旅费借款单'},
      {key: '2632', value: '会议费借款单'},
      {key: 'D3', value: '付款单'}
    ]
  },
  {key: 'double', 'label': '金额'},
  {key: 'date', label: '单据日期'},
  {key: 'boolean', label: '启用'},
  {key: 'enum', label: '性别', data: [
    {
      key: 'male',
      value: '男'
    },
    {
      key: 'female',
      value: '女'
    }
  ]},
  {key: 'ref', label: '组织（参照类型）'}
];

const gridInstance = (
  <Grid cols={mockColumnsData} tableData={tableData} />
);

ReactDOM.render(gridInstance, mountNode);
