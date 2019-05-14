import React, {Ref} from 'react'
import AvatarBadge from 'universal/components/AvatarBadge/AvatarBadge'
import styled from 'react-emotion'

const widthLookup = {
  // NOTE: Size modifies avatarImageBlock
  fill: '100%',
  smallest: '1.5rem',
  smaller: '2rem',
  small: '2.75rem',
  medium: '4rem',
  large: '5rem',
  larger: '6rem',
  largest: '7.5rem'
}
type ImageBlockProps = Pick<Props, 'sansRadius' | 'sansShadow' | 'picture' | 'size' | 'onClick'>

const ImageBlock = styled('div')(
  ({sansRadius, sansShadow, picture, size, onClick}: ImageBlockProps) => ({
    backgroundImage: `url(${picture})`,
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    borderRadius: sansRadius ? 0 : '100%',
    boxShadow: sansShadow ? 'none' : undefined,
    cursor: onClick ? 'pointer' : 'default',
    display: 'block',
    width: widthLookup[size],
    height: widthLookup[size]
  })
)

const BadgeBlock = styled('div')({
  height: '25%',
  position: 'absolute',
  right: 0,
  top: 0,
  width: '25%'
})

const BadgeBlockInner = styled('div')({
  height: '14px',
  left: '50%',
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: '14px'
})

interface Props {
  hasBadge?: boolean
  isCheckedIn?: boolean | null
  isConnected?: boolean
  onClick?: (e?: React.MouseEvent) => void
  picture: string
  sansRadius?: boolean
  sansShadow?: boolean
  innerRef?: Ref<HTMLElement>
  size: 'fill' | 'smallest' | 'smaller' | 'small' | 'medium' | 'large' | 'larger' | 'largest'
}

const Avatar = (props: Props) => {
  const {
    hasBadge,
    isCheckedIn,
    isConnected,
    onClick,
    picture,
    sansRadius,
    sansShadow,
    innerRef,
    size
  } = props

  return (
    <ImageBlock
      innerRef={innerRef}
      onClick={onClick}
      sansRadius={sansRadius}
      sansShadow={sansShadow}
      picture={picture}
      size={size}
    >
      {hasBadge && (
        <BadgeBlock>
          <BadgeBlockInner>
            <AvatarBadge isCheckedIn={isCheckedIn} isConnected={isConnected} />
          </BadgeBlockInner>
        </BadgeBlock>
      )}
    </ImageBlock>
  )
}

export default Avatar
