// API enum values. Labels are presentation only; requests always send the enum value.
export const UserRole = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' })
export const ReleaseType = Object.freeze({ DROP: 'DROP', COLLAB: 'COLLAB', CAPSULE: 'CAPSULE', SEASONAL: 'SEASONAL', LIMITED: 'LIMITED', OTHER: 'OTHER' })
export const ReleaseStatus = Object.freeze({ UPCOMING: 'UPCOMING', RELEASED: 'RELEASED', UNKNOWN: 'UNKNOWN' })
export const RequestStatus = Object.freeze({ PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' })
export const BrandCategory = Object.freeze({ STREETWEAR: 'STREETWEAR', SKATE_STREETWEAR: 'SKATE_STREETWEAR', TECHNICAL_STREETWEAR: 'TECHNICAL_STREETWEAR', CASUAL_COLLABORATION: 'CASUAL_COLLABORATION', SPORTSWEAR: 'SPORTSWEAR', CONTEMPORARY: 'CONTEMPORARY', OTHER: 'OTHER' })
export const brandCategoryLabels = Object.freeze({ STREETWEAR: 'Streetwear', SKATE_STREETWEAR: 'Skate / Streetwear', TECHNICAL_STREETWEAR: 'Technical / Streetwear', CASUAL_COLLABORATION: 'Casual / Collaboration', SPORTSWEAR: 'Sportswear', CONTEMPORARY: 'Contemporary', OTHER: 'Other' })
export const requestStatusLabels = Object.freeze({ PENDING: '검토 대기', APPROVED: '승인', REJECTED: '거절' })
