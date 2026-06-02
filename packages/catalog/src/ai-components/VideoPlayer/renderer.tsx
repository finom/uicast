import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { VideoPlayerDef } from "./def";

export const VideoPlayerRenderer = createAIComponentRenderer({
  def: VideoPlayerDef,
  renderer: ({
    src,
    poster,
    autoplay = false,
    muted = false,
    loop = false,
    width,
    onPlay,
    onPause,
    onEnded,
    generatedKey,
  }) => {
    return (
      <div
        className="rounded-lg overflow-hidden border"
        data-key={generatedKey}
      >
        <video
          src={src}
          poster={poster}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          controls
          className="w-full"
          style={width ? { width } : undefined}
          onPlay={() => onPlay?.({})}
          onPause={() => onPause?.({})}
          onEnded={() => onEnded?.({})}
        />
      </div>
    );
  },
});
