package com.portfolio.jpa.domain.order;

import com.portfolio.jpa.common.audit.BaseTimeEntity;
import com.portfolio.jpa.domain.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders",
        indexes = {
                @Index(name = "idx_orders_member", columnList = "member_id"),
                @Index(name = "idx_orders_status_ordered_at", columnList = "status, ordered_at")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(nullable = false)
    private LocalDateTime orderedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    private Order(Member member, OrderStatus status, LocalDateTime orderedAt) {
        this.member = member;
        this.status = status;
        this.orderedAt = orderedAt;
    }

    public static Order create(Member member, List<OrderItem> items) {
        Order order = new Order(member, OrderStatus.PENDING, LocalDateTime.now());
        for (OrderItem item : items) {
            order.addItem(item);
        }
        return order;
    }

    public static Order createWithOrderedAt(Member member, List<OrderItem> items,
                                            LocalDateTime orderedAt, OrderStatus status) {
        Order order = new Order(member, status, orderedAt);
        for (OrderItem item : items) {
            order.addItem(item);
        }
        return order;
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.assignOrder(this);
    }

    public void complete() {
        this.status = OrderStatus.COMPLETED;
    }

    public void cancel() {
        this.status = OrderStatus.CANCELLED;
    }
}
