---
description: 새 JPA @Entity 클래스를 프로젝트 컨벤션에 맞게 스캐폴딩한다
argument-hint: <도메인명> <엔티티명> [필드1:Type 필드2:Type ...]
---

인자로 받은 도메인과 엔티티명으로 JPA 엔티티를 생성해주세요. 예: `/entity order Order name:String price:int`

**반드시 지켜야 할 컨벤션:**
1. 위치: `backend/src/main/java/com/portfolio/jpa/<도메인>/domain/<엔티티>.java`
2. `@Entity`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 필수
3. PK: `@Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;`
4. 감사 필드: `@CreatedDate createdAt`, `@LastModifiedDate updatedAt` 포함 (BaseEntity 있으면 상속)
5. 생성은 **정적 팩토리 메서드**로만 허용 (setter 노출 금지)
6. 양방향 연관관계라면 연관관계 편의 메서드까지 같이 생성
7. 생성 후 같이 만들어야 할 것 제안: Repository 인터페이스, 기본 `@DataJpaTest`
