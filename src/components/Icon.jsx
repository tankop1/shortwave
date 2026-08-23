const ICONS = {
  home: 'https://img.icons8.com/?id=9zcV0gKAozhn&format=png&size=64',
  folder: 'https://img.icons8.com/?id=NuPLzg88cF09&format=png&size=64',
  plus: 'https://img.icons8.com/?id=FnGQHvpuVbBr&format=png&size=64',
  clapper: 'https://img.icons8.com/?id=zTqG8OB4ZgMn&format=png&size=64',
  heart: 'https://img.icons8.com/?id=yUGu5KXHNq3O&format=png&size=64',
  search: 'https://img.icons8.com/?id=Y6AAeSVIcpWt&format=png&size=64',
  filter: 'https://img.icons8.com/?id=IseFhhYMuYmz&format=png&size=64',
  play: 'https://img.icons8.com/?id=EhGBqlGKPOmj&format=png&size=64',
  close: 'https://img.icons8.com/?id=vu5kHwGC4PNb&format=png&size=64',
  menu: 'https://img.icons8.com/?id=3096&format=png&size=64',
  'add-image': 'https://img.icons8.com/?id=60628&format=png&size=64',
  share: 'https://img.icons8.com/?id=wAGXgZL0yrTF&format=png&size=64',
  sent: 'https://img.icons8.com/?id=gaBzN6YXx4ki&format=png&size=64',
  edit: 'https://img.icons8.com/?id=pzpApVcbIOwm&format=png&size=64',
  eye: 'https://img.icons8.com/?id=fhXWXkFdxrRk&format=png&size=64',
  inbox: 'https://img.icons8.com/?id=100835&format=png&size=64',
  palette: 'https://img.icons8.com/?id=102595&format=png&size=64',
  'chevron-left': 'https://img.icons8.com/?id=40024&format=png&size=64',
  'chevron-right': 'https://img.icons8.com/?id=40022&format=png&size=64',
  ellipsis: 'https://img.icons8.com/?id=102729&format=png&size=64',
  star: 'https://img.icons8.com/?id=60003&format=png&size=64',
  bug: 'https://img.icons8.com/?id=98686&format=png&size=64',
  settings: 'https://img.icons8.com/?id=59996&format=png&size=64',
  logout: 'https://img.icons8.com/?id=61022&format=png&size=64',
}

export default function Icon({ name, className = '' }) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      draggable="false"
      className={`icon ${className}`.trim()}
    />
  )
}
