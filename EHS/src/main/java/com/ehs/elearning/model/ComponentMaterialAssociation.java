package com.ehs.elearning.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "component_material_associations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"component_id", "material_id", "sequence_order"}))
public class ComponentMaterialAssociation {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", nullable = false)
    private ModuleComponent component;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private LearningMaterial material;
    
    private Integer sequenceOrder;
    
    // Constructors
    public ComponentMaterialAssociation() {
    }
    
    public ComponentMaterialAssociation(ModuleComponent component, LearningMaterial material, Integer sequenceOrder) {
        this.component = component;
        this.material = material;
        this.sequenceOrder = sequenceOrder;
    }
    
    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ModuleComponent getComponent() {
        return component;
    }

    public void setComponent(ModuleComponent component) {
        this.component = component;
    }

    public LearningMaterial getMaterial() {
        return material;
    }

    public void setMaterial(LearningMaterial material) {
        this.material = material;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }
}