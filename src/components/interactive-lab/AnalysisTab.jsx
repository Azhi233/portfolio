import { Radar } from 'react-chartjs-2';

function AnalysisTab({ radarData, radarOptions }) {
  return (
    <div className="flex animate-fade-in flex-col items-center gap-12 rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 md:flex-row">
      <div className="aspect-square max-h-[400px] w-full md:w-1/2">
        <Radar data={radarData} options={radarOptions} />
      </div>
      <div className="w-full space-y-6 md:w-1/2">
        <div className="border-l-2 border-gray-600 pl-4">
          <h4 className="mb-1 text-sm font-bold text-gray-500">虚线：传统执行摄影师</h4>
          <p className="text-sm leading-relaxed text-gray-500">仅仅通过视频网格堆砌，只能证明“机器操作”和基本的“视觉审美”达标。</p>
        </div>
        <div className="border-l-2 border-white pl-4">
          <h4 className="mb-1 text-sm font-bold text-white">实线：具备导演思维的影像创作者</h4>
          <p className="text-sm leading-relaxed text-gray-300">搭载了“交互拉片”、“前制解构”等高阶模块后，在面试官心智中，你的综合得分将得到指数级提升。</p>
        </div>
      </div>
    </div>
  );
}

export default AnalysisTab;
