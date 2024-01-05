import SVG from 'react-inlinesvg'

import Line from '@/assets/images/line.svg'
import PLRepo from '@/assets/images/pl-repo.png'
import PLViewblock from '@/assets/images/pl-viewblock.png'

export default function OpenSource() {
  return (
    <div className="w-full py-16 lg:py-[60px] flex-col justify-center items-center gap-10 lg:gap-14 flex">
      <div className="flex-col justify-start items-center gap-4 flex">
        <div className="text-center text-white text-3xl lg:text-5xl font-bold font-lekton leading-10">
          Open-source, from platform to on-chain
        </div>
      </div>
      <div className="relative justify-center items-center flex flex-col lg:flex-row">
        <div className="flex flex-col gap-2">
          <div className="h-80 bg-gray-50 rounded-lg shadow flex-col justify-start items-center flex drop-shadow-default">
            <img className="w-full h-full rounded-lg" src={PLRepo} alt="" />
          </div>
          <div className="hidden lg:block text-center text-white text-base font-normal font-inter leading-tight">
            Platform (Protocol.Land)
          </div>
        </div>
        <div className="h-7 w-px lg:w-28 lg:h-px border-2 lg:border-t-0 border-l-0 border-dotted border-[#56ADD8]"></div>
        <SVG className="hidden lg:block absolute" src={Line} />
        <div className="w-1 h-1 bg-white rounded-full shadow blur-none"></div>
        <div className="flex flex-col gap-2">
          <div className="h-80 bg-gray-50 rounded-lg shadow flex-col justify-start items-center flex drop-shadow-default">
            <img className="w-full h-full rounded-lg" src={PLViewblock} alt="" />
          </div>
          <div className="hidden lg:block text-center text-white text-base font-normal font-inter leading-tight">
            On-chain (Arscan)
          </div>
        </div>
      </div>
    </div>
  )
}