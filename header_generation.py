import random
import math
import os

def generate_animated_svg(width=1000, height=300, num_nodes=9, num_particles=4,
                          node_placement_margin_factor=0.1, node_cell_jitter_factor=0.8,
                          connection_density_factor=60, connection_distance_power=3.0,
                          max_connection_dist_multiplier=2.5):
    """
    Generates an animated SVG with procedurally placed nodes using a grid layout with jitter,
    connecting lines (randomly generated based on proximity with power law falloff and max distance),
    and particles.

    Args:
        width (int): SVG canvas width.
        height (int): SVG canvas height.
        num_nodes (int): Number of nodes to generate.
        num_particles (int): Number of floating particles.
        node_placement_margin_factor (float): Margin for node placement area from canvas edges (0.0 to <0.5).
                                            e.g., 0.1 means 10% margin on each side.
        node_cell_jitter_factor (float): Jitter for nodes within their grid cells (0.0 to 1.0).
                                         1.0 means node can be anywhere in the cell (respecting cell boundaries),
                                         0.0 means cell center.
        connection_density_factor (float): Base factor for connection probability.
                                           Value needs significant adjustment if 'connection_distance_power' is not 1.0.
                                           If power=1.0, P ~ factor/distance.
                                           If power=1.5, factor might need to be ~10-15x larger for similar connectivity at a reference distance.
                                           If power=2.0, factor might need to be ~50-100x larger.
        connection_distance_power (float): Exponent for distance in connection probability falloff (e.g., 1.0, 1.5, 2.0).
                                           Higher values make connections drop off faster with distance.
        max_connection_dist_multiplier (float): Multiplier for average grid cell dimension to set a hard maximum
                                                distance for connections. e.g., 2.5 means connect up to 2.5x avg cell dims.
    """

    nodes_data = []
    if num_nodes <= 0:
        return (f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">\n'
                f'  <rect width="100%" height="100%" fill="black" opacity="0.85"/>\n</svg>')

    # --- Node Generation with Grid Layout and Jitter ---
    if not (0 <= node_placement_margin_factor < 0.5):
        raise ValueError("node_placement_margin_factor must be between 0.0 and <0.5")
    if not (0 <= node_cell_jitter_factor <= 1.0):
        raise ValueError("node_cell_jitter_factor must be between 0.0 and 1.0")


    margin_x = width * node_placement_margin_factor
    margin_y = height * node_placement_margin_factor
    effective_width = width * (1 - 2 * node_placement_margin_factor)
    effective_height = height * (1 - 2 * node_placement_margin_factor)

    # Ensure effective dimensions are positive
    effective_width = max(1.0, effective_width)
    effective_height = max(1.0, effective_height)

    cols_grid, rows_grid = 1, 1
    if effective_width >= effective_height:
        cols_grid = math.ceil(math.sqrt(num_nodes * (effective_width / effective_height)))
        cols_grid = max(1, int(cols_grid))
        rows_grid = math.ceil(num_nodes / cols_grid)
        rows_grid = max(1, int(rows_grid))
    else: # effective_height > effective_width
        rows_grid = math.ceil(math.sqrt(num_nodes * (effective_height / effective_width)))
        rows_grid = max(1, int(rows_grid))
        cols_grid = math.ceil(num_nodes / rows_grid)
        cols_grid = max(1, int(cols_grid))
    
    # Ensure enough cells if the above somehow resulted in too few (shouldn't with ceil)
    while rows_grid * cols_grid < num_nodes:
        if effective_width * rows_grid > effective_height * cols_grid : 
             cols_grid += 1 # Grid is relatively wider, add column
        else:
             rows_grid +=1 # Grid is relatively taller or square, add row


    cell_w = effective_width / cols_grid
    cell_h = effective_height / rows_grid
    
    node_count = 0
    for r_idx in range(rows_grid):
        for c_idx in range(cols_grid):
            if node_count >= num_nodes:
                break

            # Center of the cell
            base_cx = margin_x + (c_idx + 0.5) * cell_w
            base_cy = margin_y + (r_idx + 0.5) * cell_h

            # Apply jitter: offset is from -jitter_range/2 to +jitter_range/2
            jitter_range_x = cell_w * node_cell_jitter_factor
            jitter_range_y = cell_h * node_cell_jitter_factor
            
            offset_x = (random.random() - 0.5) * jitter_range_x
            offset_y = (random.random() - 0.5) * jitter_range_y
            
            cx = base_cx + offset_x
            cy = base_cy + offset_y

            # Clamp to be within the effective drawing area (should mostly be fine due to jitter logic)
            cx = max(margin_x, min(cx, width - margin_x - 0.01)) # -0.01 to avoid exact boundary
            cy = max(margin_y, min(cy, height - margin_y - 0.01))
            
            base_r = random.uniform(2.5, 4.5)
            anim_r_min = base_r * random.uniform(0.7, 0.9)
            anim_r_max = base_r * random.uniform(1.3, 1.7)
            anim_dur_r = random.uniform(3.0, 6.0)
            anim_dur_opacity = random.uniform(3.0, 6.0)
            
            nodes_data.append(
                (cx, cy, base_r, anim_r_min, anim_r_max, anim_dur_r, anim_dur_opacity)
            )
            node_count += 1

    # --- Connection Generation ---
    connections = []
    avg_cell_dim = (cell_w + cell_h) / 2.0
    max_allowed_distance = max_connection_dist_multiplier * avg_cell_dim
    if max_allowed_distance <= 0 : # Fallback if avg_cell_dim was somehow zero
        max_allowed_distance = min(width,height)/2.0 

    for i in range(num_nodes):
        for j in range(i + 1, num_nodes):
            node1_cx, node1_cy, _, _, _, _, _ = nodes_data[i]
            node2_cx, node2_cy, _, _, _, _, _ = nodes_data[j]

            distance = math.sqrt((node1_cx - node2_cx)**2 + (node1_cy - node2_cy)**2)

            connection_probability = 0.0
            if distance > 1e-6 and distance <= max_allowed_distance: # distance > 0 and within max limit
                try:
                    # distance ** power can be very large if distance is small, or small if distance is large
                    # connection_density_factor needs to be scaled appropriately for different powers
                    prob_val = connection_density_factor / (distance ** connection_distance_power)
                    connection_probability = min(1.0, max(0.0, prob_val))
                except OverflowError: # Should be rare with typical values
                    connection_probability = 1.0 if distance < 1 else 0.0 # Heuristic for overflow
                except ZeroDivisionError: # Should be caught by distance > 1e-6
                    connection_probability = 1.0
            elif distance <= 1e-6: # Treat as same point for connection probability
                 connection_probability = 1.0


            if random.random() < connection_probability:
                connections.append((i, j))

    # --- SVG Output ---
    svg_parts = []
    svg_parts.append(f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">')
    svg_parts.append("""
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
""")
    svg_parts.append(f'  <rect width="100%" height="100%" fill="black" opacity="0.85"/>\n')

    # Lines Group
    svg_parts.append('  <g style="stroke: rgb(150, 200, 255); stroke-width: 1.8px; opacity: 0.7;">')
    for n1_idx, n2_idx in connections:
        # Indices should be valid due to generation logic
        node1 = nodes_data[n1_idx]
        node2 = nodes_data[n2_idx]
        line_anim_dur = random.uniform(7, 18)
        
        svg_parts.append(f"""    <line x1="{node1[0]:.2f}" y1="{node1[1]:.2f}" x2="{node2[0]:.2f}" y2="{node2[1]:.2f}">
      <animate attributeName="opacity" values="0;0;0.9;0.9;0;0" dur="{line_anim_dur:.2f}s" repeatCount="indefinite"/> 
    </line>""")
    svg_parts.append('  </g>\n')

    # Nodes Group
    svg_parts.append('  <g fill="rgba(170, 210, 255, 0.75)" filter="url(#glow)">')
    for cx, cy, r_base, r_min, r_max, r_dur, o_dur in nodes_data:
        svg_parts.append(f"""    <circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r_base:.2f}">
      <animate attributeName="r" values="{r_min:.2f};{r_max:.2f};{r_min:.2f}" dur="{r_dur:.2f}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;1;0.6" dur="{o_dur:.2f}s" repeatCount="indefinite"/>
    </circle>""")
    svg_parts.append('  </g>\n')

    # Floating Particles Group
    svg_parts.append('  <g fill="white">')
    particle_min_cx = int(width * node_placement_margin_factor)
    particle_max_cx = int(width * (1 - node_placement_margin_factor))
    for _ in range(num_particles):
        particle_cx = random.randint(particle_min_cx, particle_max_cx)
        
        particle_cy_start = random.randint(int(height * 0.2), int(height * 0.8))
        # Move upwards, relative to height, ensure it doesn't go too far up
        upward_movement = random.randint(int(height * 0.05), int(height * 0.15))
        particle_cy_end = max(int(height*0.05), particle_cy_start - upward_movement) 
        
        particle_r = random.uniform(0.5, 0.9)
        particle_dur = random.uniform(10, 20)
        svg_parts.append(f"""    <circle cx="{particle_cx}" cy="{particle_cy_start}" r="{particle_r:.1f}">
      <animate attributeName="cy" values="{particle_cy_start};{particle_cy_end};{particle_cy_start}" dur="{particle_dur:.2f}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0.7;0" dur="{particle_dur:.2f}s" repeatCount="indefinite"/>
    </circle>""")
    svg_parts.append('  </g>\n')

    # Closing SVG tag
    svg_parts.append('</svg>')

    return "\n".join(svg_parts)

if __name__ == "__main__":
    # Original user call from question:
    # generate_animated_svg(width=1000, height=300, num_nodes=12, num_particles=5, connection_density_factor=70)

    # To achieve more even distribution and discourage far connections:
    # 1. Node distribution is now grid-based by default using new node_..._factor parameters.
    # 2. To discourage far connections effectively:
    #    - Increase `connection_distance_power` (e.g., to 1.5 or 2.0).
    #    - Crucially, adjust `connection_density_factor` upwards significantly.
    #      If your old `connection_density_factor` (like 70) gave good results with power=1.0,
    #      for `connection_distance_power=1.5`, you might need a factor around 70 * 10 = 700 to 70 * 15 = 1050.
    #      for `connection_distance_power=2.0`, you might need a factor around 70 * 50 = 3500 to 70 * 100 = 7000.
    #      This scaling factor is roughly (avg_connection_distance_desired)^(new_power - old_power).
    #    - `max_connection_dist_multiplier` provides an additional hard cutoff.

    print("Generating SVG with improved distribution and connection logic...")
    generated_svg_code = generate_animated_svg(
        width=1000, height=300,
        num_nodes=12,
        num_particles=5,
        node_placement_margin_factor=0.1,   # Default is 0.1
        node_cell_jitter_factor=0.75,       # Default is 0.8; 0.75 gives good spread
        connection_density_factor=900,      # Adjusted UPWARDS because power is 1.5 (Original was 70 for power 1.0)
        connection_distance_power=1.5,      # Steeper falloff (Original effective power was 1.0)
        max_connection_dist_multiplier=2.2  # Max connection distance ~2.2x avg cell size
    )
    # print(generated_svg_code) # Optionally print the full SVG to console

    # To save to a file:
    output_dir = "assets/images" # As in the original script
    if not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
            print(f"Created directory: {output_dir}")
        except OSError as e:
            print(f"Error creating directory {output_dir}: {e}. Saving to current directory instead.")
            output_dir = "." # Save to current directory if creation fails

    file_path = os.path.join(output_dir, "header-animation.svg")
    
    try:
        with open(file_path, "w") as f:
            f.write(generated_svg_code)
        print(f"SVG code saved to {file_path}")
    except IOError as e:
        print(f"Error saving SVG to {file_path}: {e}")