import {defs, tiny} from './examples/common.js';
import {Text_Line} from './examples/text-demo.js';
//import {Texture} from "./tiny-graphics";
//import {Texture} from './tiny-graphics';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Final_Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            p3_ring: new defs.Torus(50, 50),
            sun: new defs.Subdivision_Sphere(4),
            planet1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            planet2: new defs.Subdivision_Sphere(2),
            planet3: new defs.Subdivision_Sphere(3),
            planet4: new defs.Subdivision_Sphere(4),
            moon: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            obstacle: new defs.Rounded_Capped_Cylinder(15, 15,  [[0, 15], [0, 15]]),
            cube: new defs.Cube(),
            cone: new defs.Closed_Cone(15,15,[[0,15],[0,15]]),
            text: new Text_Line(40),
        };

        this.images = {
            grass: "assets/grass_texture.png",
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#992828")}),
            ring: new Material(new Ring_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color('#b08040'), specularity: 1}),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)

            sun_shader: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color('#ffff00')}),

            grass_shader: new Material(new Textured_Phong(),
               {color: hex_color('#000000'),
                   ambient: 1, diffusivity: 0.1, specularity: 0.1,
                   texture: new Texture(this.images.grass),}),
            obstacle_shader: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, color: hex_color('#ADD8E6')}),
            text_image: new Material(new defs.Textured_Phong(1), {
                    ambient: 1, diffusivity: 0, specularity: 0,
                    texture: new Texture("assets/text.png"),
                }),
        }

        this.shapes.cube.arrays.texture_coord = this.shapes.cube.arrays.texture_coord.map(x => x.times(70));
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.period_denominator = 5;
        this.lives = 3;
        this.score = 0;
        this.y_angle = 0;
        this.x_angle = 0;
        this.start = false;
        this.up = false
        this.down = false;
        this.left = false;
        this.right = false;
        this.start_time = 0;
    }


    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Shoot Arrow", ["c"], () => this.start = () => true);
        this.key_triggered_button("Move Arrow Up", ["i"], () => this.up = () => true);
        this.key_triggered_button("Move Arrow Down", ["k"], () => this.down = () => true);
        this.key_triggered_button("Move Arrow Left", ["j"], () => this.left = () => true);
        this.key_triggered_button("Move Arrow Right", ["l"], () => this.right = () => true);
        this.new_line();
    }



    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        let model_transform = Mat4.identity();
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        
        //this.shapes.obstacle.draw(context, program_state, model_transform, this.materials.sun_shader);

        // TODO: Create Planets (Requirement 1)
        // this.shapes.[XXX].draw([XXX]) // <--example


        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");

        const period = 10;
        const max_scale = 3;
        const min_scale = 1;
        const scale_offset = (max_scale + min_scale) / 2;
        const radius =  scale_offset + Math.sin(((2*Math.PI)/period) * t);
        const sun_color_scale = (radius - min_scale)/(max_scale - min_scale);
        const rgb = (1 + Math.sin(2 * Math.PI / 10 * t)) / 2;
        const sun_color = color(
            1,
            rgb,
            rgb,
            1
        );

        // TODO: Lighting (Requirement 2)
        const light_position = vec4(5, 5, 9999999, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, hex_color("ffffff"), 10**radius)];

        let sun_transform = model_transform.times(Mat4.scale(radius, radius, radius));
        //this.shapes.torus.draw(context, program_state, model_transform, this.materials.test.override({color: yellow}));
        //this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sun_shader.override({color: sun_color}));

        let p1_transform = model_transform.times(Mat4.translation(-1*5*Math.cos(t), 0, 5*Math.sin(t)));
        let p2_transform = model_transform.times(Mat4.translation(-1*9*Math.cos(0.80*t), 0,9*Math.sin(0.80*t)));
        let p3_transform = model_transform.times(Mat4.translation(-1*13*Math.cos(0.60*t), 0, 13*Math.sin(0.60*t)));
        let p4_transform = model_transform.times(Mat4.translation(-1*17*Math.cos(0.40*t), 0, 17*Math.sin(0.40*t)));
        let ring_transform = p3_transform.times(Mat4.scale(4.0, 4.0, 0.1));
        let moon_transform = p4_transform.times(Mat4.translation(-2*Math.cos(1.2*t), 0, 2*Math.sin(1.2*t))).times(Mat4.scale(0.7,0.7,0.7));

        let gray = hex_color("#808080");
        let swampy_green_blue = hex_color("#80FFFF");
        let muddy_brown_orange = hex_color("#B08040");
        let soft_light_blue = hex_color("#ADD8E6");
        //this.shapes.cylinder.draw(context,program_state, model_transform, this.materials.test.override({color: hex_color("ff0000")}));
        let obstacle_transform = model_transform.times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(1,1,25));
        

        let left_to_right_obstacle = obstacle_transform.times(Mat4.translation(15*Math.cos((Math.PI/this.period_denominator)*t), 0, 0 ));
        let right_to_left_obstacle = obstacle_transform.times(Mat4.translation(-15*Math.cos((Math.PI/this.period_denominator)*t), 0, 0 ));

        let obstacle_1 = left_to_right_obstacle.times(Mat4.translation(0,-5,0.3));
        let obstacle_2 = right_to_left_obstacle.times(Mat4.translation(0,-10,0.3));
        let obstacle_3 = left_to_right_obstacle.times(Mat4.translation(0,-15,0.3));
        let obstacle_4 = right_to_left_obstacle.times(Mat4.translation(0,-20,0.3));
        //arrow
        let arrow_transform = model_transform;
        if(this.start)
        {
            if(this.up)
            {
                this.x_angle += Math.PI/180;
                this.up = false;
            }
            if(this.down)
            {
                this.x_angle -= Math.PI/180;
                this.down = false;
            }
            if(this.left)
            {
                this.y_angle += Math.PI/180;
                this.left = false;
            }
            if(this.right)
            {
                this.y_angle -= Math.PI/180;
                this.right = false;
            }
            arrow_transform = arrow_transform.times(Mat4.rotation(this.y_angle, 0, 1, 0)).times(Mat4.rotation(this.x_angle, 1, 0, 0)).times(Mat4.translation(0, 0, -1*(t- this.start_time)));
        }
        else
        {
            this.start_time = t;
        }


        let arrow_cone_transform = arrow_transform.times(Mat4.translation(0, -2, -3)).times(Mat4.rotation(Math.PI, 1, 0, 0)).times(Mat4.scale(0.4, 0.4, 0.8));
        let arrow_body_transform = arrow_transform.times(Mat4.translation(0, -2, 0)).times(Mat4.scale(0.1, 0.1, 6));
        this.shapes.cone.draw(context,program_state, arrow_cone_transform, this.materials.sun_shader.override({color: hex_color("#B2B4B6")}));
        this.shapes.obstacle.draw(context,program_state, arrow_body_transform , this.materials.sun_shader.override({color: hex_color("#964B00")}));
        //sun
        const sun_matrix = model_transform.times(Mat4.translation(-40,22,-50).times(Mat4.scale(5,5,5)));
        //this.shapes.obstacle.draw(context,program_state, model_transform , this.materials.sun_shader.override({color: hex_color("#964B00")}));
        this.shapes.sun.draw(context,program_state, sun_matrix, this.materials.sun_shader);

        //target
        this.shapes.sun.draw(context,program_state, (model_transform.times(Mat4.translation(0,0,-25)).times(Mat4.scale(1,1,0))), this.materials.obstacle_shader.override({color: hex_color("ff0000")}))
        this.shapes.sun.draw(context, program_state, (model_transform.times(Mat4.translation(0,0,-25)).times(Mat4.scale(3,3,0))), this.materials.obstacle_shader.override({color: hex_color("00ff00")}));
        this.shapes.sun.draw(context, program_state, (model_transform.times(Mat4.translation(0,0,-25))).times(Mat4.scale(5,5,0)), this.materials.obstacle_shader.override({color: hex_color("0000ff")}));
        this.shapes.sun.draw(context, program_state, (model_transform.times(Mat4.translation(0,0,-25))).times(Mat4.scale(7,7,0)), this.materials.obstacle_shader.override({color: hex_color("000000")}));
        //grass
        //this.shapes.cube.draw(context, program_state,model_transform.times(Mat4.translation(0,-10,6)).times(Mat4.scale(100,1,37)), this.materials.obstacle_shader.override({color: hex_color("04Af70")}));
        this.shapes.cube.draw(context, program_state,model_transform.times(Mat4.translation(0,-10,6)).times(Mat4.scale(100,1,37)), this.materials.grass_shader);

        //obstacles
        this.shapes.obstacle.draw(context, program_state, obstacle_1, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
        this.shapes.obstacle.draw(context, program_state, obstacle_2, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
        this.shapes.obstacle.draw(context, program_state, obstacle_3, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
        this.shapes.obstacle.draw(context, program_state, obstacle_4, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));

        this.shapes.text.set_string("Super Archer", context.context);
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-7,10,-10).times(Mat4.scale(1,1,1))), this.materials.text_image);
        this.shapes.text.set_string("Score:" + this.score, context.context);
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-3,8,-10).times(Mat4.scale(0.75,0.75,0.75))), this.materials.text_image);
        this.shapes.text.set_string("Lives:" + this.lives, context.context);
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(14,10,-10).times(Mat4.scale(0.76,0.76,0.76))), this.materials.text_image);
        //this.shapes.cylinder.draw(context, program_state, obstacle_1.times(Mat4.translation(0,-30,0)), this.materials.test.override({color: hex_color("ff0000")}));
        //this.shapes.cylinder.draw(context,program_state, model_transform.times(Mat4.scale(2,2,1)), this.materials.test.override({color: hex_color("00ff00")}));

        //this.shapes.cylinder.draw(context,program_state, model_transform.times(Mat4.scale(4,4,1)), this.materials.test.override({color: hex_color("ff0000")}));
        //this.shapes.cylinder.draw(context,program_state, model_transform.times(Mat4.scale(6,6,1)), this.materials.test.override({color: hex_color("0000ff")}));
        //this.shapes.cylinder.draw(context,program_state, model_transform.times(Mat4.scale(8,8,1)), this.materials.test.override({color: hex_color("000000")}));

        //this.shapes.obstacle.draw(context, program_state, obstacle_transform, this.materials.obstacle_shader);


        /*
        this.shapes.planet1.draw(context, program_state, p1_transform, this.materials.planet1_shader);

        if (Math.floor(t) % 2 === 1) {
            this.shapes.planet2.draw(context, program_state, p2_transform, this.materials.planet2_shader_phong);
            //this.shapes.planet2.draw(context, program_state, p2_transform, this.materials.planet2_shader_phong);
        }
        else {
            //this.shapes.planet2.draw(context, program_state, p2_transform, this.materials.planet2_shader_gouraud);
            this.shapes.planet2.draw(context, program_state, p2_transform, this.materials.planet2_shader_gouraud);
        }

        //this.shapes.planet2.draw(context, program_state, p2_transform, this.materials.test.override({color: swampy_green_blue}));
        this.shapes.planet3.draw(context, program_state, p3_transform, this.materials.test.override({color: muddy_brown_orange}));
        this.shapes.p3_ring.draw(context, program_state, ring_transform, this.materials.ring);
        this.shapes.planet4.draw(context, program_state, p4_transform, this.materials.planet4_shader);
        this.shapes.moon.draw(context, program_state, moon_transform, this.materials.moon_shader);

        // camera operations
        //this.default = Mat4.inverse(model_transform.times(Mat4.translation(0, 10, 20))
        //    .times(Mat4.rotation(-0.46, 1, 0, 0)));
        this.planet_1 = Mat4.inverse(p1_transform.times(Mat4.translation(0, 0, 5)));
        this.planet_2 = Mat4.inverse(p2_transform.times(Mat4.translation(0, 0, 5)));
        this.planet_3 = Mat4.inverse(p3_transform.times(Mat4.translation(0, 0, 5)));
        this.planet_4 = Mat4.inverse(p4_transform.times(Mat4.translation(0, 0, 5)));
        this.moon = Mat4.inverse(moon_transform.times(Mat4.translation(0, 0, 5)));
        this.solar_system = this.initial_camera_location;

        if (this.attached != undefined) {
            //let desired = Mat4.inverse(this.attached().times(Mat4.translation(0, 0, 5)));
            //program_state.camera_inverse = desired; Step 5
            program_state.camera_inverse = this.attached().map((x,i) =>
                Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        }

         */
    }

}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                // Compute an initial (ambient) color:
                vertex_color = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                vertex_color.xyz += phong_model_lights( N, vertex_worldspace );
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                gl_FragColor = vertex_color;
                return;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
            point_position = model_transform * vec4(position, 1.0);
            gl_Position = projection_camera_model_transform * vec4(position, 1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
            gl_FragColor = sin(20.0 * distance(point_position.xyz, center.xyz)) * vec4(0.6901, 0.502, 0.251, 1.0);
        }`;
    }
}