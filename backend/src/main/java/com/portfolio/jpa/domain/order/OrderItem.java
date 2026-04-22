package com.portfolio.jpa.domain.order;

import com.portfolio.jpa.common.audit.BaseTimeEntity;
import com.portfolio.jpa.domain.product.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_items",
        indexes = {
                @Index(name = "idx_order_items_order", columnList = "order_id"),
                @Index(name = "idx_order_items_product", columnList = "product_id")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int unitPrice;

    private OrderItem(Product product, int quantity) {
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = product.getPrice();
    }

    public static OrderItem create(Product product, int quantity) {
        return new OrderItem(product, quantity);
    }

    void assignOrder(Order order) {
        this.order = order;
    }
}
