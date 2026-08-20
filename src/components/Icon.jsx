const ICONS = {
  home: 'https://img.icons8.com/?id=9zcV0gKAozhn&format=png&size=64',
  compass: 'https://img.icons8.com/?id=uzPTUw2HvWxh&format=png&size=64',
  folder: 'https://img.icons8.com/?id=NuPLzg88cF09&format=png&size=64',
  plus: 'https://img.icons8.com/?id=FnGQHvpuVbBr&format=png&size=64',
  clapper: 'https://img.icons8.com/?id=zTqG8OB4ZgMn&format=png&size=64',
  heart: 'https://img.icons8.com/?id=yUGu5KXHNq3O&format=png&size=64',
  search: 'https://img.icons8.com/?id=Y6AAeSVIcpWt&format=png&size=64',
  filter: 'https://img.icons8.com/?id=IseFhhYMuYmz&format=png&size=64',
  play: 'https://img.icons8.com/?id=EhGBqlGKPOmj&format=png&size=64',
  close: 'https://img.icons8.com/?id=vu5kHwGC4PNb&format=png&size=64',
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
