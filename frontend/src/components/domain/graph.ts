export type EntityId =
  | 'Member'
  | 'Category'
  | 'Product'
  | 'Order'
  | 'OrderItem'
  | 'Review'

export interface EntityField {
  name: string
  type: string
  pk?: boolean
  fk?: boolean
}

export interface EntityData {
  id: EntityId
  label: EntityId
  tableName: string
  fields: EntityField[]
  position: { x: number; y: number }
}

export interface RelationEdge {
  id: string
  source: EntityId
  target: EntityId
  label: string
  cardinality: 'ManyToOne' | 'OneToMany'
}

export const ENTITIES: EntityData[] = [
  {
    id: 'Member',
    label: 'Member',
    tableName: 'members',
    position: { x: 40, y: 40 },
    fields: [
      { name: 'id', type: 'Long', pk: true },
      { name: 'email', type: 'String' },
      { name: 'name', type: 'String' },
    ],
  },
  {
    id: 'Order',
    label: 'Order',
    tableName: 'orders',
    position: { x: 340, y: 40 },
    fields: [
      { name: 'id', type: 'Long', pk: true },
      { name: 'member', type: 'Member', fk: true },
      { name: 'orderedAt', type: 'LocalDateTime' },
      { name: 'status', type: 'OrderStatus' },
    ],
  },
  {
    id: 'Category',
    label: 'Category',
    tableName: 'categories',
    position: { x: 920, y: 40 },
    fields: [
      { name: 'id', type: 'Long', pk: true },
      { name: 'name', type: 'String' },
    ],
  },
  {
    id: 'OrderItem',
    label: 'OrderItem',
    tableName: 'order_items',
    position: { x: 340, y: 280 },
    fields: [
      { name: 'id', type: 'Long', pk: true },
      { name: 'order', type: 'Order', fk: true },
      { name: 'product', type: 'Product', fk: true },
      { name: 'quantity', type: 'int' },
      { name: 'unitPrice', type: 'int' },
    ],
  },
  {
    id: 'Product',
    label: 'Product',
    tableName: 'products',
    position: { x: 640, y: 280 },
    fields: [
      { name: 'id', type: 'Long', pk: true },
      { name: 'name', type: 'String' },
      { name: 'price', type: 'int' },
      { name: 'stock', type: 'int' },
      { name: 'category', type: 'Category', fk: true },
    ],
  },
  {
    id: 'Review',
    label: 'Review',
    tableName: 'reviews',
    position: { x: 640, y: 540 },
    fields: [
      { name: 'id', type: 'Long', pk: true },
      { name: 'product', type: 'Product', fk: true },
      { name: 'member', type: 'Member', fk: true },
      { name: 'rating', type: 'int' },
      { name: 'content', type: 'String' },
    ],
  },
]

export const RELATIONS: RelationEdge[] = [
  {
    id: 'order-member',
    source: 'Order',
    target: 'Member',
    label: '@ManyToOne LAZY',
    cardinality: 'ManyToOne',
  },
  {
    id: 'order-items',
    source: 'Order',
    target: 'OrderItem',
    label: '@OneToMany LAZY',
    cardinality: 'OneToMany',
  },
  {
    id: 'orderitem-product',
    source: 'OrderItem',
    target: 'Product',
    label: '@ManyToOne LAZY',
    cardinality: 'ManyToOne',
  },
  {
    id: 'product-category',
    source: 'Product',
    target: 'Category',
    label: '@ManyToOne LAZY',
    cardinality: 'ManyToOne',
  },
  {
    id: 'product-reviews',
    source: 'Product',
    target: 'Review',
    label: '@OneToMany LAZY',
    cardinality: 'OneToMany',
  },
  {
    id: 'review-member',
    source: 'Review',
    target: 'Member',
    label: '@ManyToOne LAZY',
    cardinality: 'ManyToOne',
  },
]

/** SQL의 테이블 이름 → 엔티티 ID 역매핑. SQL 파서가 사용. */
export const TABLE_TO_ENTITY: Record<string, EntityId> = ENTITIES.reduce(
  (acc, e) => {
    acc[e.tableName] = e.id
    return acc
  },
  {} as Record<string, EntityId>,
)

/** 두 엔티티 사이의 RelationEdge id를 찾는다 (방향 무관). 없으면 null. */
export function findEdgeId(a: EntityId, b: EntityId): string | null {
  const rel = RELATIONS.find(
    (r) => (r.source === a && r.target === b) || (r.source === b && r.target === a),
  )
  return rel?.id ?? null
}
