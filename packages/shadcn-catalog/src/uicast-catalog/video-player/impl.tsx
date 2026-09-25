import { createComponentImplementation } from "@uicast/react";
import { blockSkeleton } from "../../lib/skeletons";
import { VideoPlayerDef } from "./def";

export const VideoPlayerImpl = createComponentImplementation({
  def: VideoPlayerDef,
  render: ({ src, poster, autoplay, muted, loop, width, onPlay, onPause, onEnded }, { entry }) => (
    <div
      className="rounded-lg overflow-hidden border"
      data-key={entry.key}
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
        onPlay={() => onPlay()}
        onPause={() => onPause()}
        onEnded={() => onEnded()}
      />
    </div>
  ),
  skeleton: blockSkeleton(240),
});
